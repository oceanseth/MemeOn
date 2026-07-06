import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import { env } from './env'
import { memeValue, tierFor } from '../../shared/tiers'
import type {
  Alert,
  AlertType,
  Friend,
  FriendStatus,
  Listing,
  Meme,
  Position,
  Trade,
  UserProfile,
} from './types'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})
const T = () => env.tableName

const strip = <T>(item: Record<string, unknown>): T => {
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item
  return rest as T
}

// ---------- users ----------

export async function getUser(sub: string): Promise<UserProfile | null> {
  const res = await ddb.send(new GetCommand({ TableName: T(), Key: { PK: `USER#${sub}`, SK: 'PROFILE' } }))
  return res.Item ? strip<UserProfile>(res.Item) : null
}

/** Create the user on first login (1000 starting coins) or refresh name/picture. */
export async function ensureUser(profile: {
  sub: string
  name: string
  picture: string | null
}): Promise<UserProfile> {
  const existing = await getUser(profile.sub)
  if (existing) {
    if (existing.name !== profile.name || existing.picture !== profile.picture) {
      await ddb.send(
        new UpdateCommand({
          TableName: T(),
          Key: { PK: `USER#${profile.sub}`, SK: 'PROFILE' },
          UpdateExpression: 'SET #n = :n, nameLower = :nl, picture = :p',
          ExpressionAttributeNames: { '#n': 'name' },
          ExpressionAttributeValues: {
            ':n': profile.name,
            ':nl': profile.name.toLowerCase(),
            ':p': profile.picture,
          },
        }),
      )
      return { ...existing, name: profile.name, picture: profile.picture }
    }
    return existing
  }
  const user: UserProfile = {
    sub: profile.sub,
    name: profile.name,
    nameLower: profile.name.toLowerCase(),
    picture: profile.picture,
    // braincells 🧠 (db field kept as `coins`): new users start empty and earn
    // their first braincells through the onboarding quests
    coins: 0,
    createdAt: new Date().toISOString(),
  }
  await ddb.send(
    new PutCommand({
      TableName: T(),
      Item: { PK: `USER#${user.sub}`, SK: 'PROFILE', GSI1PK: 'USER', GSI1SK: user.nameLower, ...user },
      ConditionExpression: 'attribute_not_exists(PK)',
    }),
  )
  return user
}

export async function searchUsers(q: string, limit = 25): Promise<UserProfile[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :p',
      ExpressionAttributeValues: { ':p': 'USER' },
      Limit: 500,
    }),
  )
  const needle = q.toLowerCase()
  return (res.Items ?? [])
    .map((i) => strip<UserProfile>(i))
    .filter((u) => !needle || u.nameLower.includes(needle))
    .slice(0, limit)
}

// ---------- memes ----------

export async function putMeme(meme: Meme): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: T(),
      Item: { PK: `MEME#${meme.id}`, SK: 'META', GSI1PK: 'MEME', GSI1SK: meme.createdAt, ...meme },
      ConditionExpression: 'attribute_not_exists(PK)',
    }),
  )
}

export async function getMeme(id: string): Promise<Meme | null> {
  const res = await ddb.send(new GetCommand({ TableName: T(), Key: { PK: `MEME#${id}`, SK: 'META' } }))
  return res.Item ? strip<Meme>(res.Item) : null
}

/** All memes, newest first. Fine at v1 scale; add pagination when it hurts. */
export async function listMemes(limit = 500): Promise<Meme[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :p',
      ExpressionAttributeValues: { ':p': 'MEME' },
      ScanIndexForward: false,
      Limit: limit,
    }),
  )
  return (res.Items ?? []).map((i) => strip<Meme>(i))
}

export async function updateMemeFields(id: string, fields: Partial<Meme>): Promise<void> {
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}
  const sets: string[] = []
  Object.entries(fields).forEach(([k, v], i) => {
    names[`#f${i}`] = k
    values[`:v${i}`] = v ?? null
    sets.push(`#f${i} = :v${i}`)
  })
  await ddb.send(
    new UpdateCommand({
      TableName: T(),
      Key: { PK: `MEME#${id}`, SK: 'META' },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ConditionExpression: 'attribute_exists(PK)',
    }),
  )
}

/**
 * Atomically count a reshare, then persist a tier change if one happened.
 * Returns the new count plus whether the meme just tiered up.
 */
export async function recordReshare(
  id: string,
): Promise<{ meme: Meme; tieredUp: boolean } | null> {
  let res
  try {
    res = await ddb.send(
      new UpdateCommand({
        TableName: T(),
        Key: { PK: `MEME#${id}`, SK: 'META' },
        UpdateExpression: 'ADD reshares :one',
        ExpressionAttributeValues: { ':one': 1 },
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      }),
    )
  } catch {
    return null
  }
  const meme = strip<Meme>(res.Attributes!)
  const tier = tierFor(meme.reshares)
  const tieredUp = tier.key !== meme.tierKey
  if (tieredUp) {
    await updateMemeFields(id, { tierKey: tier.key })
    meme.tierKey = tier.key
  }
  await sampleValueHistory(id, meme.reshares, memeValue(meme.reshares))
  return { meme, tieredUp }
}

// ---------- positions ----------

export async function getPositions(memeId: string): Promise<Position[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `MEME#${memeId}`, ':sk': 'POS#' },
    }),
  )
  return (res.Items ?? []).map((i) => strip<Position>(i)).filter((p) => p.shares > 0)
}

export async function getPortfolio(userId: string): Promise<Position[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :p',
      ExpressionAttributeValues: { ':p': `PORT#${userId}` },
    }),
  )
  return (res.Items ?? []).map((i) => strip<Position>(i)).filter((p) => p.shares > 0)
}

export function positionItem(memeId: string, userId: string, shares: number) {
  return {
    PK: `MEME#${memeId}`,
    SK: `POS#${userId}`,
    GSI1PK: `PORT#${userId}`,
    GSI1SK: `MEME#${memeId}`,
    memeId,
    userId,
    shares,
  }
}

export async function putPosition(memeId: string, userId: string, shares: number): Promise<void> {
  await ddb.send(new PutCommand({ TableName: T(), Item: positionItem(memeId, userId, shares) }))
}

/** After share transfers, point ownerId at the largest holder. */
export async function refreshOwnership(memeId: string): Promise<void> {
  const [meme, positions] = await Promise.all([getMeme(memeId), getPositions(memeId)])
  if (!meme || positions.length === 0) return
  const top = positions.reduce((a, b) => (b.shares > a.shares ? b : a))
  if (top.userId !== meme.ownerId) {
    const owner = await getUser(top.userId)
    await updateMemeFields(memeId, { ownerId: top.userId, ownerName: owner?.name ?? 'Unknown' })
  }
}

// ---------- marketplace ----------

export async function setListing(memeId: string, listing: Listing | null): Promise<void> {
  await updateMemeFields(memeId, { listing })
}

/**
 * Buy `shares` from the meme's active listing. Transactionally moves coins and
 * shares; throws on insufficient funds/shares. Caller sends alerts + refreshes ownership.
 */
export async function executeBuy(
  meme: Meme,
  listing: Listing,
  buyerId: string,
  shares: number,
): Promise<number> {
  const cost = Math.ceil(shares * listing.pricePerShare)
  const buyerPos = await getPositionShares(meme.id, buyerId)
  const remaining = listing.shares - shares
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: T(),
            Key: { PK: `USER#${buyerId}`, SK: 'PROFILE' },
            UpdateExpression: 'ADD coins :neg',
            ConditionExpression: 'coins >= :cost',
            ExpressionAttributeValues: { ':neg': -cost, ':cost': cost },
          },
        },
        {
          Update: {
            TableName: T(),
            Key: { PK: `USER#${listing.sellerId}`, SK: 'PROFILE' },
            UpdateExpression: 'ADD coins :pos',
            ExpressionAttributeValues: { ':pos': cost },
          },
        },
        {
          Update: {
            TableName: T(),
            Key: { PK: `MEME#${meme.id}`, SK: `POS#${listing.sellerId}` },
            UpdateExpression: 'ADD shares :neg',
            ConditionExpression: 'shares >= :n',
            ExpressionAttributeValues: { ':neg': -shares, ':n': shares },
          },
        },
        {
          Put: {
            TableName: T(),
            Item: positionItem(meme.id, buyerId, buyerPos + shares),
          },
        },
        {
          Update: {
            TableName: T(),
            Key: { PK: `MEME#${meme.id}`, SK: 'META' },
            UpdateExpression:
              remaining > 0 ? 'SET listing.shares = :rem' : 'SET listing = :null',
            ConditionExpression: 'listing.sellerId = :seller AND listing.shares >= :n',
            ExpressionAttributeValues:
              remaining > 0
                ? { ':rem': remaining, ':seller': listing.sellerId, ':n': shares }
                : { ':null': null, ':seller': listing.sellerId, ':n': shares },
          },
        },
      ],
    }),
  )
  return cost
}

async function getPositionShares(memeId: string, userId: string): Promise<number> {
  const res = await ddb.send(
    new GetCommand({ TableName: T(), Key: { PK: `MEME#${memeId}`, SK: `POS#${userId}` } }),
  )
  return (res.Item?.shares as number) ?? 0
}

// ---------- friends ----------

export async function listFriends(userId: string): Promise<Friend[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'FRIEND#' },
    }),
  )
  return (res.Items ?? []).map((i) => strip<Friend>(i))
}

export async function getFriend(userId: string, otherId: string): Promise<Friend | null> {
  const res = await ddb.send(
    new GetCommand({ TableName: T(), Key: { PK: `USER#${userId}`, SK: `FRIEND#${otherId}` } }),
  )
  return res.Item ? strip<Friend>(res.Item) : null
}

export async function setFriendEdge(
  userId: string,
  otherId: string,
  status: FriendStatus,
): Promise<void> {
  const edge: Friend = { userId, otherId, status, createdAt: new Date().toISOString() }
  await ddb.send(
    new PutCommand({
      TableName: T(),
      Item: { PK: `USER#${userId}`, SK: `FRIEND#${otherId}`, ...edge },
    }),
  )
}

export async function deleteFriendEdge(userId: string, otherId: string): Promise<void> {
  await ddb.send(
    new DeleteCommand({ TableName: T(), Key: { PK: `USER#${userId}`, SK: `FRIEND#${otherId}` } }),
  )
}

// ---------- trades ----------

function tradeRefItem(userId: string, trade: Trade) {
  return { PK: `USER#${userId}`, SK: `TRADE#${trade.id}`, ...trade }
}

export async function createTrade(trade: Trade): Promise<void> {
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: T(), Item: { PK: `TRADE#${trade.id}`, SK: 'META', ...trade } } },
        { Put: { TableName: T(), Item: tradeRefItem(trade.fromId, trade) } },
        { Put: { TableName: T(), Item: tradeRefItem(trade.toId, trade) } },
      ],
    }),
  )
}

export async function getTrade(id: string): Promise<Trade | null> {
  const res = await ddb.send(new GetCommand({ TableName: T(), Key: { PK: `TRADE#${id}`, SK: 'META' } }))
  return res.Item ? strip<Trade>(res.Item) : null
}

export async function listTrades(userId: string): Promise<Trade[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'TRADE#' },
    }),
  )
  return (res.Items ?? [])
    .map((i) => strip<Trade>(i))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Update trade status on the META item and both user refs. */
export async function setTradeStatus(trade: Trade, status: Trade['status']): Promise<Trade> {
  const resolvedAt = new Date().toISOString()
  const updated = { ...trade, status, resolvedAt }
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: T(), Item: { PK: `TRADE#${trade.id}`, SK: 'META', ...updated } } },
        { Put: { TableName: T(), Item: tradeRefItem(trade.fromId, updated) } },
        { Put: { TableName: T(), Item: tradeRefItem(trade.toId, updated) } },
      ],
    }),
  )
  return updated
}

/**
 * Execute an accepted trade: move each side's meme shares and coins.
 * Throws (transaction cancelled) if either party lacks the goods.
 */
export async function executeTrade(trade: Trade): Promise<void> {
  const items: NonNullable<
    ConstructorParameters<typeof TransactWriteCommand>[0]['TransactItems']
  > = []

  const moveCoins = (from: string, to: string, amount: number) => {
    if (amount <= 0) return
    items.push({
      Update: {
        TableName: T(),
        Key: { PK: `USER#${from}`, SK: 'PROFILE' },
        UpdateExpression: 'ADD coins :neg',
        ConditionExpression: 'coins >= :amt',
        ExpressionAttributeValues: { ':neg': -amount, ':amt': amount },
      },
    })
    items.push({
      Update: {
        TableName: T(),
        Key: { PK: `USER#${to}`, SK: 'PROFILE' },
        UpdateExpression: 'ADD coins :pos',
        ExpressionAttributeValues: { ':pos': amount },
      },
    })
  }

  const moveShares = async (from: string, to: string, memeId: string, shares: number) => {
    const toShares = await getPositionShares(memeId, to)
    items.push({
      Update: {
        TableName: T(),
        Key: { PK: `MEME#${memeId}`, SK: `POS#${from}` },
        UpdateExpression: 'ADD shares :neg',
        ConditionExpression: 'shares >= :n',
        ExpressionAttributeValues: { ':neg': -shares, ':n': shares },
      },
    })
    items.push({ Put: { TableName: T(), Item: positionItem(memeId, to, toShares + shares) } })
  }

  moveCoins(trade.fromId, trade.toId, trade.offer.coins)
  moveCoins(trade.toId, trade.fromId, trade.ask.coins)
  for (const m of trade.offer.memes) await moveShares(trade.fromId, trade.toId, m.memeId, m.shares)
  for (const m of trade.ask.memes) await moveShares(trade.toId, trade.fromId, m.memeId, m.shares)

  await ddb.send(new TransactWriteCommand({ TransactItems: items }))
}

// ---------- onboarding quests ----------

export type QuestKey = 'pack' | 'mint' | 'share' | 'friend' | 'trade'

/**
 * Mark a quest complete exactly once and pay its braincell reward.
 * Returns true only on first completion.
 */
export async function completeQuest(
  userId: string,
  key: QuestKey,
  reward: number,
): Promise<boolean> {
  try {
    // make sure the onboarding map exists (older accounts predate it)
    await ddb.send(
      new UpdateCommand({
        TableName: T(),
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET onboarding = if_not_exists(onboarding, :empty)',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':empty': {} },
      }),
    )
    await ddb.send(
      new UpdateCommand({
        TableName: T(),
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET onboarding.#k = :now ADD coins :r',
        ConditionExpression: 'attribute_not_exists(onboarding.#k)',
        ExpressionAttributeNames: { '#k': key },
        ExpressionAttributeValues: { ':now': new Date().toISOString(), ':r': reward },
      }),
    )
    return true
  } catch {
    return false // user missing or quest already complete
  }
}

/** Top braincell holders (excluding house accounts). */
export async function topHolders(limit = 10): Promise<UserProfile[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :p',
      ExpressionAttributeValues: { ':p': 'USER' },
      Limit: 1000,
    }),
  )
  return (res.Items ?? [])
    .map((i) => strip<UserProfile>(i))
    .filter((u) => u.sub !== VAULT_SUB)
    .sort((a, b) => b.coins - a.coins)
    .slice(0, limit)
}

export const VAULT_SUB = 'memeon_vault'
/** house account owning seeded/archive memes until a creator claims them */
export const ARCHIVE_SUB = 'meme_archive'

// ---------- creator claims (for archive-seeded memes) ----------

export async function putClaim(claim: import('./types').CreatorClaim): Promise<boolean> {
  try {
    await ddb.send(
      new PutCommand({
        TableName: T(),
        Item: { PK: `MEME#${claim.memeId}`, SK: `CLAIM#${claim.userId}`, ...claim },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    )
    return true
  } catch {
    return false
  }
}

export async function listClaims(memeId: string): Promise<import('./types').CreatorClaim[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `MEME#${memeId}`, ':sk': 'CLAIM#' },
    }),
  )
  return (res.Items ?? []).map((i) => strip<import('./types').CreatorClaim>(i))
}

export async function setClaimStatus(
  memeId: string,
  userId: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: T(),
      Key: { PK: `MEME#${memeId}`, SK: `CLAIM#${userId}` },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
      ConditionExpression: 'attribute_exists(PK)',
    }),
  )
}

/**
 * Starter pack: transfer 10 vault shares in each given meme to the user and
 * complete the 'pack' quest (+reward braincells) in one transaction — the
 * quest condition makes the whole claim idempotent.
 */
export async function claimVaultPack(
  userId: string,
  memeIds: string[],
  reward: number,
): Promise<void> {
  // ensure the onboarding map exists before the conditional write
  await ddb.send(
    new UpdateCommand({
      TableName: T(),
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET onboarding = if_not_exists(onboarding, :empty)',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeValues: { ':empty': {} },
    }),
  )
  const items: NonNullable<
    ConstructorParameters<typeof TransactWriteCommand>[0]['TransactItems']
  > = [
    {
      Update: {
        TableName: T(),
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET onboarding.#k = :now ADD coins :r',
        ConditionExpression: 'attribute_not_exists(onboarding.#k)',
        ExpressionAttributeNames: { '#k': 'pack' },
        ExpressionAttributeValues: { ':now': new Date().toISOString(), ':r': reward },
      },
    },
  ]
  for (const memeId of memeIds) {
    const existing = await ddb.send(
      new GetCommand({ TableName: T(), Key: { PK: `MEME#${memeId}`, SK: `POS#${userId}` } }),
    )
    const current = (existing.Item?.shares as number) ?? 0
    items.push({
      Update: {
        TableName: T(),
        Key: { PK: `MEME#${memeId}`, SK: `POS#${VAULT_SUB}` },
        UpdateExpression: 'ADD shares :neg',
        ConditionExpression: 'shares >= :ten',
        ExpressionAttributeValues: { ':neg': -10, ':ten': 10 },
      },
    })
    items.push({ Put: { TableName: T(), Item: positionItem(memeId, userId, current + 10) } })
  }
  await ddb.send(new TransactWriteCommand({ TransactItems: items }))
}

// ---------- likes / dislikes (feed signals) ----------

export async function setLike(userId: string, memeId: string): Promise<boolean> {
  try {
    await ddb.send(
      new PutCommand({
        TableName: T(),
        Item: {
          PK: `USER#${userId}`,
          SK: `LIKE#${memeId}`,
          GSI1PK: `LIKERS#${memeId}`,
          GSI1SK: userId,
          userId,
          memeId,
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    )
  } catch {
    return false // already liked
  }
  await bumpLikeCount(memeId, 1)
  return true
}

export async function removeLike(userId: string, memeId: string): Promise<boolean> {
  const res = await ddb.send(
    new DeleteCommand({
      TableName: T(),
      Key: { PK: `USER#${userId}`, SK: `LIKE#${memeId}` },
      ReturnValues: 'ALL_OLD',
    }),
  )
  if (!res.Attributes) return false
  await bumpLikeCount(memeId, -1)
  return true
}

async function bumpLikeCount(memeId: string, delta: number): Promise<void> {
  await ddb
    .send(
      new UpdateCommand({
        TableName: T(),
        Key: { PK: `MEME#${memeId}`, SK: 'META' },
        UpdateExpression: 'ADD likes :d',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':d': delta },
      }),
    )
    .catch(() => {})
}

export async function listLikes(userId: string): Promise<string[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'LIKE#' },
    }),
  )
  return (res.Items ?? []).map((i) => i.memeId as string)
}

export async function setDislike(userId: string, memeId: string): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: T(),
      Item: {
        PK: `USER#${userId}`,
        SK: `DISLIKE#${memeId}`,
        userId,
        memeId,
        createdAt: new Date().toISOString(),
      },
    }),
  )
  await removeLike(userId, memeId)
}

export async function listDislikes(userId: string): Promise<string[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'DISLIKE#' },
    }),
  )
  return (res.Items ?? []).map((i) => i.memeId as string)
}

// ---------- follows ----------

export async function setFollow(userId: string, creatorId: string): Promise<boolean> {
  try {
    await ddb.send(
      new PutCommand({
        TableName: T(),
        Item: {
          PK: `USER#${userId}`,
          SK: `FOLLOW#${creatorId}`,
          GSI1PK: `FOLLOWERS#${creatorId}`,
          GSI1SK: userId,
          userId,
          creatorId,
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    )
  } catch {
    return false
  }
  await bumpFollowerCount(creatorId, 1)
  return true
}

export async function removeFollow(userId: string, creatorId: string): Promise<boolean> {
  const res = await ddb.send(
    new DeleteCommand({
      TableName: T(),
      Key: { PK: `USER#${userId}`, SK: `FOLLOW#${creatorId}` },
      ReturnValues: 'ALL_OLD',
    }),
  )
  if (!res.Attributes) return false
  await bumpFollowerCount(creatorId, -1)
  return true
}

async function bumpFollowerCount(creatorId: string, delta: number): Promise<void> {
  await ddb
    .send(
      new UpdateCommand({
        TableName: T(),
        Key: { PK: `USER#${creatorId}`, SK: 'PROFILE' },
        UpdateExpression: 'ADD followers :d',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':d': delta },
      }),
    )
    .catch(() => {})
}

export async function isFollowing(userId: string, creatorId: string): Promise<boolean> {
  const res = await ddb.send(
    new GetCommand({ TableName: T(), Key: { PK: `USER#${userId}`, SK: `FOLLOW#${creatorId}` } }),
  )
  return !!res.Item
}

// ---------- memeplex (related-meme graph) ----------

/** Link two memes into each other's memeplex (bidirectional edge). */
export async function addPlexEdge(a: string, b: string, addedBy: string): Promise<void> {
  const createdAt = new Date().toISOString()
  await Promise.all(
    [
      [a, b],
      [b, a],
    ].map(([from, to]) =>
      ddb.send(
        new PutCommand({
          TableName: T(),
          Item: { PK: `MEME#${from}`, SK: `PLEX#${to}`, memeId: from, otherId: to, addedBy, createdAt },
        }),
      ),
    ),
  )
}

export async function listPlex(memeId: string): Promise<string[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `MEME#${memeId}`, ':sk': 'PLEX#' },
    }),
  )
  return (res.Items ?? []).map((i) => i.otherId as string)
}

// ---------- value history (hourly samples, written on reshares) ----------

export async function sampleValueHistory(memeId: string, reshares: number, value: number) {
  const hour = new Date().toISOString().slice(0, 13) // e.g. 2026-07-06T19
  await ddb
    .send(
      new PutCommand({
        TableName: T(),
        Item: {
          PK: `MEME#${memeId}`,
          SK: `HIST#${hour}`,
          at: `${hour}:00:00Z`,
          reshares,
          value,
        },
        ConditionExpression: 'attribute_not_exists(PK)', // one sample per hour
      }),
    )
    .catch(() => {})
}

export async function listHistory(
  memeId: string,
  limit = 500,
): Promise<{ at: string; reshares: number; value: number }[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `MEME#${memeId}`, ':sk': 'HIST#' },
      Limit: limit,
    }),
  )
  return (res.Items ?? []).map((i) => ({
    at: i.at as string,
    reshares: i.reshares as number,
    value: i.value as number,
  }))
}

// ---------- alerts ----------

export async function addAlert(
  userId: string,
  type: AlertType,
  message: string,
  memeId: string | null = null,
): Promise<void> {
  const createdAt = new Date().toISOString()
  const id = `${createdAt}#${randomUUID().slice(0, 8)}`
  const alert: Alert = { id, userId, type, message, memeId, read: false, createdAt }
  await ddb.send(
    new PutCommand({ TableName: T(), Item: { PK: `USER#${userId}`, SK: `ALERT#${id}`, ...alert } }),
  )
}

export async function listAlerts(userId: string, limit = 50): Promise<Alert[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: T(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'ALERT#' },
      ScanIndexForward: false,
      Limit: limit,
    }),
  )
  return (res.Items ?? []).map((i) => strip<Alert>(i))
}

export async function markAlertsRead(userId: string, ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      ddb.send(
        new UpdateCommand({
          TableName: T(),
          Key: { PK: `USER#${userId}`, SK: `ALERT#${id}` },
          UpdateExpression: 'SET #r = :t',
          ExpressionAttributeNames: { '#r': 'read' },
          ExpressionAttributeValues: { ':t': true },
        }),
      ),
    ),
  )
}
