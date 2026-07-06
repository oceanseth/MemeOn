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
import { tierFor } from '../../shared/tiers'
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
    coins: 1000,
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
