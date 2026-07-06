// Discord app backend: signature-verified interactions webhook, /memeon search
// with binder/friends priority, and MemeOn↔Discord account linking.
// Config: SSM {SSM_PREFIX}/discord = { application_id, public_key, bot_token }
import { createPublicKey, verify as edVerify } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import * as db from './db'
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
  const all = (await db.listMemes()).filter((m) => !m.private)
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
  const needle = query.trim().toLowerCase()
  return all
    .filter(
      (m) =>
        !needle ||
        m.title.toLowerCase().includes(needle) ||
        (m.tags ?? []).some((t) => t.toLowerCase().includes(needle)) ||
        m.creatorName.toLowerCase().includes(needle),
    )
    .map((m) => ({ ...m, rank: mine.has(m.id) ? 0 : friendly.has(m.id) ? 1 : 2 }))
    .sort((a, b) => a.rank - b.rank || b.reshares - a.reshares)
    .slice(0, limit)
}

export function memeChoiceLabel(m: Meme & { rank: number }): string {
  const tier = tierFor(m.reshares)
  const badge = m.rank === 0 ? '💼 ' : m.rank === 1 ? '🤝 ' : ''
  const label = `${badge}${m.title} · ${tier.name} · 🔁${m.reshares} · 🧠${memeValue(m.reshares)}`
  return label.slice(0, 100) // discord choice-name cap
}

export const shareUrl = (memeId: string): string => `${env.siteOrigin}/m/${memeId}`
