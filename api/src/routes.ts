import { randomUUID } from 'node:crypto'
import * as db from './db'
import * as discord from './discord'
import * as giphy from './giphy'
import { env } from './env'
import * as masky from './masky'
import { authed, HttpError, html, json, maskyToken, redirect, requireString, route } from './http'
import { issueSession, verifySession } from './session'
import { mintFirebaseToken } from './firebase'
import { ensureOgImage, frameKey, memePageHtml, tierFrameList } from './og'
import { assetUrl, presignUpload, putAsset } from './s3'
import { memeValue, TIERS, tierFor, tierIndexFor } from '../../shared/tiers'
import type { Meme, Trade, TradeSide } from './types'

// ---------- health ----------

route('GET /api/helloworld', () => ({
  statusCode: 200,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
  body: 'helloworld',
}))

// ---------- auth ----------

route('GET /api/auth/masky/config', async () => json(200, await masky.publicConfig()))

route('POST /api/auth/masky/callback', async (req) => {
  const code = requireString(req.body, 'code')
  const redirectUri = requireString(req.body, 'redirectUri')
  const tokens = await masky.exchangeCode(code, redirectUri)
  const profile = await masky.fetchProfile(tokens.accessToken)
  const name = profile.name ?? tokens.avatar?.name ?? 'Anonymous'
  const picture = profile.picture ?? tokens.avatar?.picture ?? null
  const user = await db.ensureUser({ sub: profile.id, name, picture })
  const sessionToken = await issueSession({ sub: user.sub, name: user.name, picture: user.picture })
  const firebaseToken = await mintFirebaseToken(user.sub, { name: user.name })
  return json(200, {
    sessionToken,
    maskyAccessToken: tokens.accessToken,
    firebaseToken,
    profile: { sub: user.sub, name: user.name, picture: user.picture, coins: user.coins },
  })
})

// ---------- onboarding quests + braincells ----------

export const QUESTS: { key: db.QuestKey; title: string; reward: number; hint: string }[] = [
  {
    key: 'pack',
    title: 'Claim your starter pack',
    reward: 20,
    hint: 'Crack open a free pack of meme shares from the MemeOn Vault.',
  },
  {
    key: 'mint',
    title: 'Mint your first meme',
    reward: 100,
    hint: 'Generate, remix, or upload — your first card earns big.',
  },
  {
    key: 'share',
    title: 'Get your first reshare',
    reward: 50,
    hint: 'Share a meme you minted anywhere — the first link hit pays out.',
  },
  {
    key: 'friend',
    title: 'Make a friend',
    reward: 25,
    hint: 'Invite someone or accept a request.',
  },
  {
    key: 'trade',
    title: 'Complete a trade or purchase',
    reward: 25,
    hint: 'Buy shares or close a trade — welcome to the market.',
  },
]

/** Complete a quest once, with the alert attached. Safe to call repeatedly. */
async function awardQuest(userId: string, key: db.QuestKey): Promise<void> {
  const quest = QUESTS.find((q) => q.key === key)
  if (!quest) return
  const first = await db.completeQuest(userId, key, quest.reward)
  if (first) {
    await db.addAlert(userId, 'friend', `🧠 +${quest.reward} braincells — ${quest.title.toLowerCase()} ✅`)
  }
}

authed('GET /api/onboarding', async (req) => {
  const user = await db.getUser(req.user.sub)
  if (!user) throw new HttpError(404, 'user not found')
  return json(200, {
    steps: QUESTS.map((q) => ({ ...q, done: !!user.onboarding?.[q.key] })),
    braincells: user.coins,
  })
})

authed('POST /api/onboarding/claim-pack', async (req) => {
  const user = await db.getUser(req.user.sub)
  if (!user) throw new HttpError(404, 'user not found')
  if (user.onboarding?.pack) return json(200, { ok: true, already: true, memes: [], reward: 0 })

  const vaultPositions = await db.getPortfolio(db.VAULT_SUB)
  const eligible = vaultPositions.filter((p) => p.shares >= 10)
  const picks = [...eligible].sort(() => Math.random() - 0.5).slice(0, 3)
  const packQuest = QUESTS.find((q) => q.key === 'pack')!
  // if the vault is dry, the pack falls back to a bigger braincell grant
  const reward = picks.length > 0 ? packQuest.reward : 50
  try {
    await db.claimVaultPack(
      req.user.sub,
      picks.map((p) => p.memeId),
      reward,
    )
  } catch {
    throw new HttpError(409, 'pack already claimed or vault changed — refresh and retry')
  }
  const memes = (
    await Promise.all(picks.map((p) => db.getMeme(p.memeId)))
  ).filter((m): m is Meme => !!m)
  await db.addAlert(
    req.user.sub,
    'friend',
    `🎁 Starter pack opened: ${memes.length ? memes.map((m) => `10 shares of "${m.title}"`).join(', ') + ' and' : ''} +${reward} braincells!`,
  )
  return json(200, { ok: true, memes: memes.map(publicMeme), reward })
})

authed('GET /api/leaderboard', async () => {
  const top = await db.topHolders(10)
  const rows = await Promise.all(
    top.map(async (u) => {
      const { value, collectionSize } = await portfolioSummary(u.sub)
      return {
        sub: u.sub,
        name: u.name,
        picture: u.picture,
        braincells: u.coins,
        portfolioValue: value,
        collectionSize,
      }
    }),
  )
  return json(200, { leaders: rows })
})

// ---------- me / users ----------

async function portfolioSummary(userId: string) {
  const positions = await db.getPortfolio(userId)
  const memes = (
    await Promise.all(positions.map((p) => db.getMeme(p.memeId)))
  ).filter((m): m is Meme => !!m)
  const byId = new Map(memes.map((m) => [m.id, m]))
  let value = 0
  for (const p of positions) {
    const m = byId.get(p.memeId)
    if (m) value += (p.shares / 100) * memeValue(m.reshares)
  }
  return { positions, memes, value: Math.round(value), collectionSize: positions.length }
}

authed('GET /api/me', async (req) => {
  const user = await db.getUser(req.user.sub)
  if (!user) throw new HttpError(404, 'user not found')
  const { value, collectionSize } = await portfolioSummary(user.sub)
  const alerts = await db.listAlerts(user.sub, 50)
  return json(200, {
    sub: user.sub,
    name: user.name,
    picture: user.picture,
    coins: user.coins,
    portfolioValue: value,
    collectionSize,
    unreadAlerts: alerts.filter((a) => !a.read).length,
    onboarding: user.onboarding ?? {},
  })
})

authed('GET /api/users', async (req) => {
  const users = await db.searchUsers(req.query.q ?? '')
  return json(200, {
    users: users
      .filter((u) => u.sub !== req.user.sub)
      .map((u) => ({ sub: u.sub, name: u.name, picture: u.picture })),
  })
})

// ---------- memes / marketplace ----------

const publicMeme = (m: Meme) => ({ ...m, tier: tierFor(m.reshares), value: memeValue(m.reshares) })

authed('GET /api/memes', async (req) => {
  let memes = (await db.listMemes()).filter((m) => !m.private)
  const { q, type, tier, listed, sort } = req.query
  if (q) {
    const needle = q.toLowerCase()
    memes = memes.filter(
      (m) =>
        m.title.toLowerCase().includes(needle) ||
        (m.tags ?? []).some((t) => t.toLowerCase().includes(needle)) ||
        m.creatorName.toLowerCase().includes(needle),
    )
  }
  if (type === 'image' || type === 'video') memes = memes.filter((m) => m.mediaType === type)
  if (tier) memes = memes.filter((m) => tierFor(m.reshares).key === tier)
  if (listed === 'true') memes = memes.filter((m) => m.listing && m.listing.shares > 0)
  if (sort === 'viral') memes = [...memes].sort((a, b) => b.reshares - a.reshares)
  else if (sort === 'value') memes = [...memes].sort((a, b) => memeValue(b.reshares) - memeValue(a.reshares))
  // default: newest first (query order)
  return json(200, { memes: memes.map(publicMeme) })
})

authed('POST /api/memes', async (req) => {
  // titles must fit the og card's banner: hard 20-char cap
  const title = requireString(req.body, 'title', 20)
  const imageUrl = requireString(req.body, 'imageUrl', 2000)
  const mediaType = req.body.mediaType === 'video' ? 'video' : 'image'
  const videoUrl = typeof req.body.videoUrl === 'string' ? req.body.videoUrl : null
  if (mediaType === 'video' && !videoUrl) throw new HttpError(400, 'video memes need videoUrl')
  const description =
    typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : null
  const tags = Array.isArray(req.body.tags)
    ? req.body.tags.filter((t): t is string => typeof t === 'string').slice(0, 8)
    : []
  const remixOf = typeof req.body.remixOf === 'string' ? req.body.remixOf.slice(0, 40) : null
  // attribution for memes minted straight from Giphy search (unedited)
  const rawSource = req.body.source as Record<string, unknown> | undefined
  const source =
    rawSource && rawSource.provider === 'giphy' && typeof rawSource.id === 'string'
      ? {
          provider: 'giphy',
          id: String(rawSource.id).slice(0, 64),
          url: typeof rawSource.url === 'string' ? rawSource.url.slice(0, 300) : `https://giphy.com/gifs/${rawSource.id}`,
          author: typeof rawSource.author === 'string' ? rawSource.author.slice(0, 100) : null,
        }
      : null
  const meme: Meme = {
    id: randomUUID().slice(0, 12),
    title,
    description,
    mediaType,
    imageUrl,
    videoUrl,
    tags,
    creatorId: req.user.sub,
    creatorName: req.user.name,
    ownerId: req.user.sub,
    ownerName: req.user.name,
    reshares: 0,
    tierKey: TIERS[0].key,
    listing: null,
    createdAt: new Date().toISOString(),
    remixOf,
    private: false,
    source,
  }
  await db.putMeme(meme)
  await db.putPosition(meme.id, req.user.sub, 100)
  if (remixOf) await db.addPlexEdge(meme.id, remixOf, req.user.sub).catch(() => {})
  await awardQuest(req.user.sub, 'mint')
  // pre-render the og card so the first crawler hit (facebook is impatient and
  // caches failures for weeks) finds the image already sitting in S3
  await ensureOgImage(meme).catch(() => {})
  return json(201, { meme: publicMeme(meme) })
})

route('GET /api/memes/:id', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const positions = await db.getPositions(meme.id)
  if (meme.private) {
    // soft-deleted: only shareholders can still see it
    const viewer = await verifySession(req.headers.authorization)
    if (!viewer || !positions.some((p) => p.userId === viewer.sub))
      throw new HttpError(404, 'meme not found')
  }
  return json(200, { meme: publicMeme(meme), positions })
})

/** Sole owners (100/100 shares) can hide a meme from every public surface. */
authed('POST /api/memes/:id/visibility', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const positions = await db.getPositions(meme.id)
  const mine = positions.find((p) => p.userId === req.user.sub)
  if (!mine || mine.shares < 100)
    throw new HttpError(403, 'only a 100% owner can change visibility')
  const makePrivate = !!req.body.private
  await db.updateMemeFields(meme.id, {
    private: makePrivate,
    // a hidden meme shouldn't stay purchasable
    ...(makePrivate ? { listing: null } : {}),
  })
  return json(200, { ok: true, private: makePrivate })
})

authed('POST /api/memes/:id/list', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const pricePerShare = Number(req.body.pricePerShare)
  const shares = Math.floor(Number(req.body.shares))
  if (!(pricePerShare > 0) || !(shares > 0)) throw new HttpError(400, 'invalid price or shares')
  const positions = await db.getPositions(meme.id)
  const mine = positions.find((p) => p.userId === req.user.sub)
  if (!mine || mine.shares < shares) throw new HttpError(400, 'you do not hold that many shares')
  if (meme.listing && meme.listing.sellerId !== req.user.sub)
    throw new HttpError(409, 'another holder already has an active listing on this meme')
  await db.setListing(meme.id, {
    sellerId: req.user.sub,
    pricePerShare: Math.round(pricePerShare * 100) / 100,
    shares,
  })
  return json(200, { ok: true })
})

authed('POST /api/memes/:id/unlist', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  if (meme.listing && meme.listing.sellerId !== req.user.sub)
    throw new HttpError(403, 'not your listing')
  await db.setListing(meme.id, null)
  return json(200, { ok: true })
})

authed('POST /api/memes/:id/buy', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  if (!meme.listing || meme.listing.shares <= 0) throw new HttpError(409, 'meme is not listed')
  if (meme.listing.sellerId === req.user.sub) throw new HttpError(400, 'cannot buy your own listing')
  const shares = Math.min(Math.floor(Number(req.body.shares) || 0), meme.listing.shares)
  if (shares <= 0) throw new HttpError(400, 'invalid share count')
  let cost: number
  try {
    cost = await db.executeBuy(meme, meme.listing, req.user.sub, shares)
  } catch {
    throw new HttpError(409, 'purchase failed — insufficient coins or listing changed')
  }
  await db.refreshOwnership(meme.id)
  await db.addAlert(
    meme.listing.sellerId,
    'sale',
    `💰 ${req.user.name} bought ${shares} share${shares === 1 ? '' : 's'} of "${meme.title}" for ${cost} braincells`,
    meme.id,
  )
  await awardQuest(req.user.sub, 'trade')
  await awardQuest(meme.listing.sellerId, 'trade')
  return json(200, { ok: true, shares, cost })
})

authed('GET /api/binder', async (req) => {
  const { positions, memes } = await portfolioSummary(req.user.sub)
  const all = await db.listMemes()
  const created = all.filter((m) => m.creatorId === req.user.sub)
  const held = new Map(positions.map((p) => [p.memeId, p.shares]))
  const byId = new Map<string, Meme>()
  for (const m of [...memes, ...created]) byId.set(m.id, m)
  return json(200, {
    memes: [...byId.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => ({
        ...publicMeme(m),
        myShares: held.get(m.id) ?? 0,
        isCreator: m.creatorId === req.user.sub,
      })),
  })
})

// ---------- aigen (bills the user's Masky credits) ----------

authed('POST /api/aigen/image', async (req) => {
  const prompt = requireString(req.body, 'prompt')
  const aspectRatio = typeof req.body.aspectRatio === 'string' ? req.body.aspectRatio : '1:1'
  const out = await masky.generateImage(maskyToken(req), prompt, aspectRatio)
  return json(200, out)
})

authed('POST /api/aigen/video', async (req) => {
  const prompt = requireString(req.body, 'prompt')
  const image = typeof req.body.image === 'string' ? req.body.image : undefined
  const srcVideo = typeof req.body.srcVideo === 'string' ? req.body.srcVideo : undefined
  const out = await masky.generateVideo(maskyToken(req), {
    prompt,
    image,
    srcVideo,
    resolution: '720p',
  })
  return json(202, out)
})

/** Remix: image-to-image edit on the source meme's art (bills the user's credits). */
authed('POST /api/aigen/image-edit', async (req) => {
  const prompt = requireString(req.body, 'prompt')
  const imageUrls = Array.isArray(req.body.imageUrls)
    ? req.body.imageUrls.filter((u): u is string => typeof u === 'string')
    : []
  if (imageUrls.length === 0) throw new HttpError(400, 'imageUrls required')
  const out = await masky.editImage(maskyToken(req), prompt, imageUrls)
  return json(200, out)
})

authed('GET /api/aigen/video/:id', async (req) => {
  const out = await masky.videoStatus(maskyToken(req), req.params.id)
  return json(200, out)
})

// ---------- friends ----------

authed('GET /api/friends', async (req) => {
  const edges = await db.listFriends(req.user.sub)
  const enriched = await Promise.all(
    edges.map(async (e) => {
      const profile = await db.getUser(e.otherId)
      const stats =
        e.status === 'accepted'
          ? await portfolioSummary(e.otherId)
          : { value: 0, collectionSize: 0 }
      return {
        sub: e.otherId,
        name: profile?.name ?? 'Unknown',
        picture: profile?.picture ?? null,
        status: e.status,
        collectionSize: stats.collectionSize,
        portfolioValue: stats.value,
      }
    }),
  )
  return json(200, { friends: enriched })
})

authed('POST /api/friends/request', async (req) => {
  const otherId = requireString(req.body, 'userId')
  if (otherId === req.user.sub) throw new HttpError(400, 'cannot friend yourself')
  const other = await db.getUser(otherId)
  if (!other) throw new HttpError(404, 'user not found')
  const existing = await db.getFriend(req.user.sub, otherId)
  if (existing) return json(200, { ok: true, status: existing.status })
  await db.setFriendEdge(req.user.sub, otherId, 'outgoing')
  await db.setFriendEdge(otherId, req.user.sub, 'incoming')
  await db.addAlert(otherId, 'friend', `👋 ${req.user.name} sent you a friend request`)
  return json(200, { ok: true, status: 'outgoing' })
})

authed('POST /api/friends/respond', async (req) => {
  const otherId = requireString(req.body, 'userId')
  const edge = await db.getFriend(req.user.sub, otherId)
  if (!edge || edge.status !== 'incoming') throw new HttpError(404, 'no pending request')
  if (req.body.accept) {
    await db.setFriendEdge(req.user.sub, otherId, 'accepted')
    await db.setFriendEdge(otherId, req.user.sub, 'accepted')
    await db.addAlert(otherId, 'friend', `🤝 ${req.user.name} accepted your friend request`)
    await awardQuest(req.user.sub, 'friend')
    await awardQuest(otherId, 'friend')
  } else {
    await db.deleteFriendEdge(req.user.sub, otherId)
    await db.deleteFriendEdge(otherId, req.user.sub)
  }
  return json(200, { ok: true })
})

authed('POST /api/friends/remove', async (req) => {
  const otherId = requireString(req.body, 'userId')
  await db.deleteFriendEdge(req.user.sub, otherId)
  await db.deleteFriendEdge(otherId, req.user.sub)
  return json(200, { ok: true })
})

// ---------- trades ----------

function parseTradeSide(v: unknown): TradeSide {
  const side = (v ?? {}) as Record<string, unknown>
  const memes = Array.isArray(side.memes)
    ? side.memes
        .map((m) => m as Record<string, unknown>)
        .map((m) => ({ memeId: String(m.memeId ?? ''), shares: Math.floor(Number(m.shares) || 0) }))
        .filter((m) => m.memeId && m.shares > 0)
    : []
  const coins = Math.max(0, Math.floor(Number(side.coins) || 0))
  if (memes.length > 6) throw new HttpError(400, 'too many memes in one trade')
  return { memes, coins }
}

async function assertHoldings(userId: string, side: TradeSide, label: string) {
  const user = await db.getUser(userId)
  if (!user) throw new HttpError(404, `${label} not found`)
  if (user.coins < side.coins) throw new HttpError(400, `${label} lacks the offered coins`)
  for (const m of side.memes) {
    const positions = await db.getPositions(m.memeId)
    const pos = positions.find((p) => p.userId === userId)
    if (!pos || pos.shares < m.shares)
      throw new HttpError(400, `${label} does not hold ${m.shares} shares of ${m.memeId}`)
  }
}

authed('GET /api/trades', async (req) => json(200, { trades: await db.listTrades(req.user.sub) }))

authed('POST /api/trades', async (req) => {
  const toId = requireString(req.body, 'toId')
  if (toId === req.user.sub) throw new HttpError(400, 'cannot trade with yourself')
  const to = await db.getUser(toId)
  if (!to) throw new HttpError(404, 'recipient not found')
  const offer = parseTradeSide(req.body.offer)
  const ask = parseTradeSide(req.body.ask)
  if (offer.memes.length + ask.memes.length + offer.coins + ask.coins === 0)
    throw new HttpError(400, 'empty trade')
  await assertHoldings(req.user.sub, offer, 'you')
  await assertHoldings(toId, ask, 'recipient')
  const trade: Trade = {
    id: randomUUID().slice(0, 12),
    fromId: req.user.sub,
    fromName: req.user.name,
    toId,
    toName: to.name,
    offer,
    ask,
    status: 'proposed',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  }
  await db.createTrade(trade)
  await db.addAlert(toId, 'trade', `🔁 ${req.user.name} proposed a trade with you`)
  return json(201, { trade })
})

authed('POST /api/trades/:id/respond', async (req) => {
  const trade = await db.getTrade(req.params.id)
  if (!trade) throw new HttpError(404, 'trade not found')
  if (trade.status !== 'proposed') throw new HttpError(409, `trade already ${trade.status}`)
  const action = requireString(req.body, 'action')
  if (action === 'cancel') {
    if (trade.fromId !== req.user.sub) throw new HttpError(403, 'only the proposer can cancel')
    return json(200, { trade: await db.setTradeStatus(trade, 'cancelled') })
  }
  if (trade.toId !== req.user.sub) throw new HttpError(403, 'only the recipient can respond')
  if (action === 'decline') {
    const updated = await db.setTradeStatus(trade, 'declined')
    await db.addAlert(trade.fromId, 'trade', `❌ ${req.user.name} declined your trade`)
    return json(200, { trade: updated })
  }
  if (action !== 'accept') throw new HttpError(400, 'action must be accept, decline, or cancel')
  try {
    await db.executeTrade(trade)
  } catch {
    throw new HttpError(409, 'trade failed — one side no longer holds the goods')
  }
  const updated = await db.setTradeStatus(trade, 'accepted')
  await Promise.all(
    [...trade.offer.memes, ...trade.ask.memes].map((m) => db.refreshOwnership(m.memeId)),
  )
  await db.addAlert(trade.fromId, 'trade', `✅ ${req.user.name} accepted your trade!`)
  await awardQuest(trade.fromId, 'trade')
  await awardQuest(trade.toId, 'trade')
  return json(200, { trade: updated })
})

// ---------- alerts ----------

authed('GET /api/alerts', async (req) => json(200, { alerts: await db.listAlerts(req.user.sub) }))

authed('POST /api/alerts/read', async (req) => {
  const ids = Array.isArray(req.body.ids)
    ? req.body.ids.filter((i): i is string => typeof i === 'string')
    : []
  await db.markAlertsRead(req.user.sub, ids)
  return json(200, { ok: true })
})

// ---------- uploads (mint from your own file) ----------

const UPLOAD_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB

authed('POST /api/uploads', async (req) => {
  const contentType = requireString(req.body, 'contentType', 100)
  const ext = UPLOAD_TYPES[contentType]
  if (!ext) throw new HttpError(400, `unsupported content type (${Object.keys(UPLOAD_TYPES).join(', ')})`)
  const size = Math.floor(Number(req.body.size) || 0)
  const cap = contentType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (size <= 0) throw new HttpError(400, 'size (bytes) required')
  if (size > cap) {
    throw new HttpError(413, `file too large — max ${Math.round(cap / 1024 / 1024)}MB for ${contentType.split('/')[0]}s`)
  }
  const key = `uploads/${req.user.sub}/${randomUUID()}.${ext}`
  const out = await presignUpload(key, contentType, size)
  return json(200, out)
})

// ---------- likes / dislikes ----------

authed('POST /api/memes/:id/like', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const added = await db.setLike(req.user.sub, meme.id)
  return json(200, { ok: true, liked: true, added })
})

authed('POST /api/memes/:id/unlike', async (req) => {
  await db.removeLike(req.user.sub, req.params.id)
  return json(200, { ok: true, liked: false })
})

/** Swipe-left: hide from this user's feed permanently (also clears any like). */
authed('POST /api/memes/:id/dislike', async (req) => {
  await db.setDislike(req.user.sub, req.params.id)
  return json(200, { ok: true })
})

// ---------- feed (mobile infinite scroll) ----------

/**
 * Prioritized feed: memes owned or liked by the user's friends come first
 * (with attribution), then everything else by virality/recency. Excludes
 * the user's own memes and anything they've disliked. Cursor = offset.
 */
authed('GET /api/feed', async (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const offset = Math.max(Number(req.query.cursor) || 0, 0)

  const [allMemes, disliked, myLikes, friends] = await Promise.all([
    db.listMemes(),
    db.listDislikes(req.user.sub),
    db.listLikes(req.user.sub),
    db.listFriends(req.user.sub),
  ])
  const dislikedSet = new Set(disliked)
  const likedSet = new Set(myLikes)
  const accepted = friends.filter((f) => f.status === 'accepted').slice(0, 25)

  const friendOwners = new Map<string, string[]>()
  const friendLikers = new Map<string, string[]>()
  await Promise.all(
    accepted.map(async (f) => {
      const profile = await db.getUser(f.otherId)
      const name = profile?.name ?? 'a friend'
      const [positions, likes] = await Promise.all([
        db.getPortfolio(f.otherId),
        db.listLikes(f.otherId),
      ])
      for (const p of positions) {
        friendOwners.set(p.memeId, [...(friendOwners.get(p.memeId) ?? []), name])
      }
      for (const memeId of likes) {
        friendLikers.set(memeId, [...(friendLikers.get(memeId) ?? []), name])
      }
    }),
  )

  const scored = allMemes
    .filter((m) => !m.private && !dislikedSet.has(m.id))
    .filter((m) => m.creatorId !== req.user.sub && m.ownerId !== req.user.sub)
    .map((m) => ({
      meme: m,
      score:
        (friendOwners.get(m.id)?.length ?? 0) * 3 + (friendLikers.get(m.id)?.length ?? 0) * 2,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.meme.reshares - a.meme.reshares ||
        b.meme.createdAt.localeCompare(a.meme.createdAt),
    )

  const page = scored.slice(offset, offset + limit)
  return json(200, {
    items: page.map(({ meme, score }) => ({
      ...publicMeme(meme),
      likes: meme.likes ?? 0,
      likedByMe: likedSet.has(meme.id),
      friendOwners: friendOwners.get(meme.id) ?? [],
      friendLikers: friendLikers.get(meme.id) ?? [],
      friendSignal: score,
    })),
    nextCursor: offset + limit < scored.length ? String(offset + limit) : null,
  })
})

// ---------- invites ----------

/** Public invite landing data: who's inviting you + their best cards. */
route('GET /api/invite/:sub', async (req) => {
  const inviter = await db.getUser(req.params.sub)
  if (!inviter) throw new HttpError(404, 'invite not found')
  const [allMemes, positions, stats] = await Promise.all([
    db.listMemes(),
    db.getPortfolio(inviter.sub),
    portfolioSummary(inviter.sub),
  ])
  const held = new Set(positions.map((p) => p.memeId))
  const topMemes = allMemes
    .filter((m) => !m.private)
    .filter((m) => m.creatorId === inviter.sub || held.has(m.id))
    .sort((a, b) => b.reshares - a.reshares)
    .slice(0, 4)
    .map(publicMeme)
  return json(200, {
    inviter: {
      sub: inviter.sub,
      name: inviter.name,
      picture: inviter.picture,
      followers: (inviter as { followers?: number }).followers ?? 0,
      collectionSize: stats.collectionSize,
      portfolioValue: stats.value,
    },
    topMemes,
  })
})

/** Called after the invitee logs in: invite implies mutual consent → instant friendship. */
authed('POST /api/invites/accept', async (req) => {
  const inviterId = requireString(req.body, 'inviterId')
  if (inviterId === req.user.sub) return json(200, { ok: true, self: true })
  const inviter = await db.getUser(inviterId)
  if (!inviter) throw new HttpError(404, 'inviter not found')
  const existing = await db.getFriend(req.user.sub, inviterId)
  if (existing?.status === 'accepted') return json(200, { ok: true, already: true })
  await db.setFriendEdge(req.user.sub, inviterId, 'accepted')
  await db.setFriendEdge(inviterId, req.user.sub, 'accepted')
  await db.addAlert(inviterId, 'friend', `🎉 ${req.user.name} accepted your invite — you're now friends!`)
  await awardQuest(req.user.sub, 'friend')
  await awardQuest(inviterId, 'friend')
  return json(200, { ok: true })
})

// ---------- follows + creator profiles ----------

authed('POST /api/users/:sub/follow', async (req) => {
  if (req.params.sub === req.user.sub) throw new HttpError(400, 'cannot follow yourself')
  const target = await db.getUser(req.params.sub)
  if (!target) throw new HttpError(404, 'user not found')
  const added = await db.setFollow(req.user.sub, target.sub)
  if (added) await db.addAlert(target.sub, 'friend', `⭐ ${req.user.name} followed you`)
  return json(200, { ok: true, following: true })
})

authed('POST /api/users/:sub/unfollow', async (req) => {
  await db.removeFollow(req.user.sub, req.params.sub)
  return json(200, { ok: true, following: false })
})

/** Creator profile: identity + follower count + their created memes + binder. */
authed('GET /api/users/:sub/profile', async (req) => {
  const target = await db.getUser(req.params.sub)
  if (!target) throw new HttpError(404, 'user not found')
  const [allMemes, positions, following, friendEdge, stats] = await Promise.all([
    db.listMemes(),
    db.getPortfolio(target.sub),
    db.isFollowing(req.user.sub, target.sub),
    db.getFriend(req.user.sub, target.sub),
    portfolioSummary(target.sub),
  ])
  const isSelf = req.user.sub === target.sub
  const visible = allMemes.filter((m) => isSelf || !m.private)
  const created = visible.filter((m) => m.creatorId === target.sub)
  const held = new Map(positions.map((p) => [p.memeId, p.shares]))
  const binder = visible
    .filter((m) => held.has(m.id))
    .map((m) => ({ ...publicMeme(m), shares: held.get(m.id) ?? 0 }))
  return json(200, {
    profile: {
      sub: target.sub,
      name: target.name,
      picture: target.picture,
      followers: (target as { followers?: number }).followers ?? 0,
      collectionSize: stats.collectionSize,
      portfolioValue: stats.value,
      createdAt: target.createdAt,
    },
    followingByMe: following,
    friendStatus: friendEdge?.status ?? null,
    created: created.map(publicMeme),
    binder,
  })
})

// ---------- creator claims (archive memes) ----------

/**
 * Archive-seeded memes (owned by the Meme Archive house account) can be
 * claimed by their real creators. Claims are recorded for review; approval
 * happens via api/scripts/approve-claim.ts (transfers creatorship + shares).
 */
authed('POST /api/memes/:id/claim', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  if (meme.creatorId !== db.ARCHIVE_SUB)
    throw new HttpError(400, 'this meme already has a creator')
  const note = typeof req.body.note === 'string' ? req.body.note.slice(0, 500) : ''
  const fresh = await db.putClaim({
    memeId: meme.id,
    userId: req.user.sub,
    userName: req.user.name,
    note,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  if (!fresh) return json(200, { ok: true, already: true })
  await db.addAlert(
    req.user.sub,
    'friend',
    `📼 Creator claim filed for "${meme.title}" — we'll review it and transfer the card if it checks out.`,
    meme.id,
  )
  return json(200, { ok: true })
})

// ---------- memeplex ----------

/**
 * The memeplex: a meme's family — its remix ancestry back to the original,
 * memes remixed from it, and manually linked relatives.
 */
route('GET /api/memes/:id/memeplex', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')

  // walk remixOf ancestry up to the original (cycle/depth guarded)
  const ancestors: Meme[] = []
  let cursor: Meme | null = meme
  const seen = new Set([meme.id])
  while (cursor?.remixOf && ancestors.length < 10) {
    const parent: Meme | null = await db.getMeme(cursor.remixOf)
    if (!parent || seen.has(parent.id)) break
    seen.add(parent.id)
    ancestors.unshift(parent)
    cursor = parent
  }

  const [allMemes, plexIds] = await Promise.all([db.listMemes(), db.listPlex(meme.id)])
  const remixes = allMemes.filter((m) => m.remixOf === meme.id && !m.private)
  const plexSet = new Set(plexIds)
  const related = allMemes.filter(
    (m) => plexSet.has(m.id) && !m.private && m.remixOf !== meme.id && !seen.has(m.id),
  )

  return json(200, {
    original: ancestors.length > 0 ? publicMeme(ancestors[0]) : null,
    ancestors: ancestors.map(publicMeme),
    remixes: remixes.map(publicMeme),
    related: related.map(publicMeme),
  })
})

/** Creator or any shareholder of a meme can add relatives to its memeplex. */
authed('POST /api/memes/:id/memeplex', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const otherId = requireString(req.body, 'memeId', 40)
  if (otherId === meme.id) throw new HttpError(400, 'a meme is already in its own memeplex')
  const other = await db.getMeme(otherId)
  if (!other) throw new HttpError(404, 'related meme not found')
  const positions = await db.getPositions(meme.id)
  const canEdit =
    meme.creatorId === req.user.sub || positions.some((p) => p.userId === req.user.sub)
  if (!canEdit) throw new HttpError(403, 'only the creator or shareholders can edit the memeplex')
  await db.addPlexEdge(meme.id, other.id, req.user.sub)
  if (other.ownerId !== req.user.sub) {
    await db.addAlert(
      other.ownerId,
      'friend',
      `🕸️ "${other.title}" was added to the memeplex of "${meme.title}"`,
      other.id,
    )
  }
  return json(200, { ok: true })
})

// ---------- value history ----------

route('GET /api/memes/:id/history', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme) throw new HttpError(404, 'meme not found')
  const points = await db.listHistory(meme.id)
  // always end the series at "now" so charts show the live value
  points.push({
    at: new Date().toISOString(),
    reshares: meme.reshares,
    value: memeValue(meme.reshares),
  })
  return json(200, { points })
})

// ---------- giphy proxy (meme creator) ----------

authed('GET /api/giphy/categories', async () => json(200, { categories: await giphy.categories() }))

authed('GET /api/giphy/search', async (req) => {
  const q = (req.query.q ?? '').trim()
  if (!q) throw new HttpError(400, 'q required')
  return json(200, { results: await giphy.search(q) })
})

// ---------- discord app ----------

/** Public install info for the /discord page. */
route('GET /api/discord/config', async () => {
  const cfg = await discord.discordConfig()
  if (!cfg) return json(200, { configured: false, installUrl: null })
  return json(200, {
    configured: true,
    installUrl: `https://discord.com/oauth2/authorize?client_id=${cfg.application_id}`,
  })
})

/** Complete account linking (user clicked the /memeon-connect link and logged in). */
authed('POST /api/discord/link', async (req) => {
  const token = requireString(req.body, 'token', 2000)
  const discordUserId = await discord.readLinkToken(token)
  if (!discordUserId) throw new HttpError(400, 'link token invalid or expired — run /memeon-connect again')
  await db.linkDiscord(discordUserId, req.user.sub)
  await db.addAlert(
    req.user.sub,
    'friend',
    '🎮 Discord connected — /memeon now puts your binder and friends first.',
  )
  return json(200, { ok: true })
})

/** Discord interactions webhook (signature-verified). */
route('POST /api/discord/interactions', async (req) => {
  const cfg = await discord.discordConfig()
  if (!cfg) throw new HttpError(503, 'discord app not configured')
  const sig = req.headers['x-signature-ed25519']
  const ts = req.headers['x-signature-timestamp']
  if (
    !sig ||
    !ts ||
    !discord.verifyDiscordSignature(cfg.public_key, sig, ts, req.rawBody)
  ) {
    throw new HttpError(401, 'bad signature')
  }

  const interaction = req.body as {
    type: number
    data?: {
      name?: string
      custom_id?: string
      options?: { name: string; value?: string; focused?: boolean }[]
    }
    member?: { user?: { id?: string } }
    user?: { id?: string }
  }

  if (interaction.type === 1) return json(200, { type: 1 }) // PING → PONG

  // component clicks from the visual picker
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id ?? ''
    if (customId === 'cancel') {
      return json(200, {
        type: 7, // update the ephemeral picker in place
        data: { content: '🧠 Picker closed.', embeds: [], components: [] },
      })
    }
    if (customId.startsWith('post:')) {
      const meme = await db.getMeme(customId.slice(5))
      if (!meme || meme.private) {
        return json(200, { type: 4, data: { flags: 64, content: 'That meme vanished 😶' } })
      }
      // public post into the channel; the /m/ unfurl shows the card + counts a reshare
      return json(200, { type: 4, data: { content: discord.shareUrl(meme.id) } })
    }
  }

  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id ?? ''
  const linkedSub = discordUserId ? await db.discordLinkedSub(discordUserId) : null
  const command = interaction.data?.name ?? ''
  const queryOpt = interaction.data?.options?.find((o) => o.name === 'query')

  // autocomplete: live results as they type, binder/friends first
  if (interaction.type === 4) {
    const results = await discord.searchMemesFor(linkedSub, String(queryOpt?.value ?? ''), 8)
    return json(200, {
      type: 8,
      data: {
        choices: results.map((m) => ({ name: discord.memeChoiceLabel(m), value: m.id })),
      },
    })
  }

  if (interaction.type === 2 && command === 'memeon-connect') {
    const token = await discord.makeLinkToken(discordUserId)
    return json(200, {
      type: 4,
      data: {
        flags: 64, // ephemeral
        content: linkedSub
          ? '✅ Already connected! `/memeon` puts your binder and friends first.'
          : `🧠 Connect your MemeOn account so search puts your memes first:\n${env.siteOrigin}/discord/link?token=${token}`,
      },
    })
  }

  if (interaction.type === 2 && command === 'memeon') {
    const value = String(queryOpt?.value ?? '').trim()
    // picked a specific card from autocomplete → post it straight away
    const exact = value ? await db.getMeme(value) : null
    if (exact && !exact.private) {
      return json(200, { type: 4, data: { content: discord.shareUrl(exact.id) } })
    }
    // free-text search → private visual picker (giphy-style): thumbnails + Send buttons
    const results = await discord.searchMemesFor(linkedSub, value, 4)
    if (results.length === 0) {
      return json(200, {
        type: 4,
        data: { flags: 64, content: `😶 No memes matched "${value}". Mint one at ${env.siteOrigin}` },
      })
    }
    return json(200, {
      type: 4,
      data: {
        flags: 64, // only the searcher sees the picker
        content: `🧠 Results for **${value || 'top memes'}** — pick one to drop it in chat:`,
        embeds: results.map((m, i) => ({
          title: `${i + 1}. ${discord.memeChoiceLabel(m)}`,
          image: { url: m.imageUrl },
          color: parseInt(tierFor(m.reshares).color.replace('#', ''), 16),
        })),
        components: [
          {
            type: 1, // action row
            components: [
              ...results.map((m, i) => ({
                type: 2, // button
                style: 1,
                label: `Send #${i + 1}`,
                custom_id: `post:${m.id}`,
              })),
              { type: 2, style: 2, label: '✕', custom_id: 'cancel' },
            ],
          },
        ],
      },
    })
  }

  return json(200, { type: 4, data: { flags: 64, content: 'unknown command' } })
})

// ---------- tier frames + og ----------

route('GET /api/frames', () => json(200, { tiers: TIERS, frames: tierFrameList() }))

/** Env-aware pointer to brand art in the assets bucket (braincell mascot, etc). */
route('GET /api/brand/:file', (req) => {
  const file = req.params.file.replace(/[^a-z0-9.-]/gi, '')
  return redirect(assetUrl(`brand/${file}`), 'public, max-age=3600')
})

/** Regenerate a tier's card frame art with Masky (bills the caller's credits). */
authed('POST /api/admin/frames', async (req) => {
  const tierKey = requireString(req.body, 'tierKey')
  const tier = TIERS.find((t) => t.key === tierKey)
  if (!tier) throw new HttpError(400, 'unknown tier')
  const prompt = framePrompt(tier.name, tierIndexFor(tier.minReshares))
  const out = await masky.generateImage(maskyToken(req), prompt, '3:4')
  const res = await fetch(out.imageUrl)
  if (!res.ok) throw new HttpError(502, 'failed to download generated frame')
  const buf = Buffer.from(await res.arrayBuffer())
  const url = await putAsset(frameKey(tier.key), buf, 'image/png')
  return json(200, { url })
})

export function framePrompt(tierName: string, tierIdx: number): string {
  const styles = [
    'plain matte cardboard, simple thin gray border, subtle paper texture, muted colors',
    'brushed silver metallic border with embossed uncommon stamp, cool gray tones, soft sheen',
    'holographic rainbow foil border, prismatic sparkle rays, cyan-magenta light refraction',
    'liquid chrome mirror-finish border, ultra rare energy arcs, blue-violet reflections',
    'ornate gold foil border, legendary radiant sunburst engraving, warm golden glow',
    'iridescent prismatic secret-rare border, rainbow crystal facets, pink-purple aurora',
    'mythic shiny cosmic border, galaxy foil with glittering stars, teal-gold shimmering aura',
  ]
  return (
    `Trading card frame design, portrait 3:4, in the style of a collectible monster trading card. ` +
    `${styles[tierIdx] ?? styles[0]}. ` +
    `A completely EMPTY dark charcoal square art window occupying the middle of the card ` +
    `(leave the center blank — no artwork inside the window). ` +
    `A wide EMPTY dark banner strip along the bottom of the frame for a title to be added later. ` +
    `Ornate corners, high detail, studio quality, absolutely NO text, letters, or words anywhere.`
  )
}

route('GET /api/memes/:id/og.png', async (req) => {
  const meme = await db.getMeme(req.params.id)
  if (!meme || meme.private) throw new HttpError(404, 'meme not found')
  const url = await ensureOgImage(meme)
  return redirect(url, 'public, max-age=300')
})

/**
 * The unique share URL for a meme. Every load (human or crawler unfurl) counts
 * as a reshare — that IS the virality mechanic.
 */
route('GET /m/:id', async (req) => {
  const existing = await db.getMeme(req.params.id)
  if (existing?.private) return html(404, '<h1>This meme has gone private (404)</h1>')
  const result = await db.recordReshare(req.params.id)
  if (!result) return html(404, '<h1>This meme has not been minted (404)</h1>')
  const { meme, tieredUp } = result
  if (tieredUp) {
    const tier = tierFor(meme.reshares)
    const holders = await db.getPositions(meme.id)
    await Promise.all(
      holders.map((h) =>
        db.addAlert(
          h.userId,
          'tierup',
          `🚀 "${meme.title}" tiered up to ${tier.name.toUpperCase()} (${tier.rarity}) at ${meme.reshares.toLocaleString()} reshares!`,
          meme.id,
        ),
      ),
    )
  }
  await awardQuest(meme.creatorId, 'share')
  const ogImageUrl = await ensureOgImage(meme).catch(
    () => `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}/api/memes/${meme.id}/og.png`,
  )
  return html(200, await memePageHtml(meme, ogImageUrl))
})
