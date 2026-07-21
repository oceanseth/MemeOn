import * as db from './db'
import { memeValue } from '../../shared/tiers'

/**
 * Positions past this cap are counted but not priced, bounding request-time
 * work for whale accounts. Background jobs pass priceAll to price everything.
 */
const MAX_PRICED_POSITIONS = 2000

export async function portfolioSummary(userId: string, opts: { priceAll?: boolean } = {}) {
  const positions = await db.getPortfolio(userId)
  const priced = opts.priceAll ? positions : positions.slice(0, MAX_PRICED_POSITIONS)
  const memes = await db.getMemesByIds(priced.map((p) => p.memeId))
  const byId = new Map(memes.map((m) => [m.id, m]))
  let value = 0
  for (const p of priced) {
    const m = byId.get(p.memeId)
    if (m) value += (p.shares / 100) * memeValue(m.reshares)
  }
  return { positions, memes, value: Math.round(value), collectionSize: positions.length }
}
