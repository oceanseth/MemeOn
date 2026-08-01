// Discord app backend: signature-verified interactions webhook, /memeon search
// with binder/friends priority, and MemeOn↔Discord account linking.
// Config: SSM {SSM_PREFIX}/discord = { application_id, public_key, bot_token }
import { createPublicKey, verify as edVerify } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import * as db from './db'
import * as vectors from './vectors'
import { env } from './env'
import { getJsonSecret, getSecret } from './ssm'
import { memeValue, tierFor } from '../../shared/tiers'
import type { Meme } from './types'

export interface DiscordConfig {
  application_id: string
  public_key: string
  bot_token?: string
}

export async function discordConfig(): Promise<DiscordConfig | null> {
  try {
    return await getJsonSecret<DiscordConfig>('discord')
  } catch {
    return null
  }
}

/** Verify Discord's ed25519 request signature (raw 32-byte hex public key). */
export function verifyDiscordSignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  rawBody: string,
): boolean {
  try {
    // wrap the raw ed25519 key in SPKI so node's verifier accepts it
    const raw = Buffer.from(publicKeyHex, 'hex')
    const spki = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      raw,
    ])
    const key = createPublicKey({ key: spki, format: 'der', type: 'spki' })
    return edVerify(
      null,
      Buffer.from(timestamp + rawBody),
      key,
      Buffer.from(signatureHex, 'hex'),
    )
  } catch {
    return false
  }
}

// ---------- account linking ----------

const LINK_ISSUER = 'memeon-discord-link'

export async function makeLinkToken(discordUserId: string): Promise<string> {
  const secret = new TextEncoder().encode(await getSecret('session_secret'))
  return new SignJWT({ d: discordUserId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(LINK_ISSUER)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}

export async function readLinkToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(await getSecret('session_secret'))
    const { payload } = await jwtVerify(token, secret, { issuer: LINK_ISSUER })
    return (payload.d as string) ?? null
  } catch {
    return null
  }
}

// ---------- meme search with binder/friends priority ----------

export async function searchMemesFor(
  memeonSub: string | null,
  query: string,
  limit = 8,
): Promise<(Meme & { rank: number })[]> {
  const needle = query.trim()
  const lower = needle.toLowerCase()
  const { mine, friendly } = await binderAndFriendSets(memeonSub)
  const rankOf = (id: string) => (mine.has(id) ? 0 : friendly.has(id) ? 1 : 2)
  const lexicalHit = (m: Meme) =>
    !needle ||
    m.title.toLowerCase().includes(lower) ||
    (m.tags ?? []).some((t) => t.toLowerCase().includes(lower)) ||
    m.creatorName.toLowerCase().includes(lower)

  const seen = new Set<string>()
  const out: (Meme & { rank: number })[] = []

  // Prefer binder + friend-signal memes (cheap batch-get) before discovery fill.
  const priorityIds = [...new Set([...mine, ...friendly])]
  for (const m of await db.getMemesByIds(priorityIds)) {
    if (m.private || !lexicalHit(m) || seen.has(m.id)) continue
    seen.add(m.id)
    out.push({ ...m, rank: rankOf(m.id) })
  }

  // Fill remaining slots: semantic when querying, else/fallback bounded listMemesPage.
  if (out.length < limit) {
    for (const m of await findCandidates(needle, limit, seen)) {
      if (out.length >= limit) break
      if (m.private || seen.has(m.id)) continue
      seen.add(m.id)
      out.push({ ...m, rank: rankOf(m.id) })
    }
  }

  // semantic candidates arrive best-match-first — keep that order within each
  // rank tier (Array.sort is stable); browsing with no query ranks by reshares
  return (
    needle
      ? out.sort((a, b) => a.rank - b.rank)
      : out.sort((a, b) => a.rank - b.rank || b.reshares - a.reshares)
  ).slice(0, limit)
}

/**
 * Discovery candidates for Discord autocomplete. Empty query → one newest page.
 * Non-empty → semantic vectors, with marketplace-style lexical page scan fallback.
 */
async function findCandidates(
  needle: string,
  limit: number,
  exclude: Set<string>,
): Promise<Meme[]> {
  if (!needle) {
    const page = await db.listMemesPage({ limit: 100 })
    return page.memes.filter((m) => !m.private && !exclude.has(m.id))
  }
  try {
    const ids = await vectors.searchIds(needle, Math.max(limit * 3, 24))
    const byId = new Map((await db.getMemesByIds(ids)).map((m) => [m.id, m]))
    return ids
      .map((id) => byId.get(id))
      .filter((m): m is Meme => !!m && !m.private && !exclude.has(m.id))
  } catch (err) {
    console.error('semantic search failed, falling back to lexical', err)
    const lower = needle.toLowerCase()
    const out: Meme[] = []
    let cursor: string | null = null
    // scan at most 10 pages (~1000 memes) — same bound as marketplace search
    for (let i = 0; i < 10 && out.length < limit; i++) {
      const page = await db.listMemesPage({ cursor, limit: 100 })
      for (const m of page.memes) {
        if (out.length >= limit) break
        if (m.private || exclude.has(m.id)) continue
        if (
          m.title.toLowerCase().includes(lower) ||
          (m.tags ?? []).some((t) => t.toLowerCase().includes(lower)) ||
          m.creatorName.toLowerCase().includes(lower)
        ) {
          out.push(m)
        }
      }
      cursor = page.nextCursor
      if (!cursor) break
    }
    return out
  }
}

/** Meme ids in the caller's binder, and in friends' binders/likes. */
async function binderAndFriendSets(
  memeonSub: string | null,
): Promise<{ mine: Set<string>; friendly: Set<string> }> {
  const mine = new Set<string>()
  const friendly = new Set<string>()
  if (memeonSub) {
    const [positions, friends] = await Promise.all([
      db.getPortfolio(memeonSub),
      db.listFriends(memeonSub),
    ])
    positions.forEach((p) => mine.add(p.memeId))
    const accepted = friends.filter((f) => f.status === 'accepted').slice(0, 25)
    await Promise.all(
      accepted.map(async (f) => {
        const [pos, likes] = await Promise.all([
          db.getPortfolio(f.otherId),
          db.listLikes(f.otherId),
        ])
        pos.forEach((p) => friendly.add(p.memeId))
        likes.forEach((id) => friendly.add(id))
      }),
    )
  }
  return { mine, friendly }
}

export function memeChoiceLabel(m: Meme & { rank: number }): string {
  const tier = tierFor(m.reshares)
  const badge = m.rank === 0 ? '💼 ' : m.rank === 1 ? '🤝 ' : ''
  const label = `${badge}${m.title} · ${tier.name} · 🔁${m.reshares} · 🧠${memeValue(m.reshares)}`
  return label.slice(0, 100) // discord choice-name cap
}

export const shareUrl = (memeId: string): string => `${env.siteOrigin}/m/${memeId}`
