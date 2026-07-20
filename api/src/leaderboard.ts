// Leaderboard rebuild (EventBridge → lambda with {action:"leaderboard-rebuild"}).
// Streams all users for the top 10 by braincells, prices their portfolios, and
// stores the finished board as one item; GET /api/leaderboard is a single read.
import * as db from './db'
import { portfolioSummary } from './portfolio'

export async function rebuildLeaderboard(): Promise<{ leaders: db.LeaderboardRow[]; computedAt: string }> {
  const top = await db.topHolders(10)
  const leaders = await Promise.all(
    top.map(async (u) => {
      const { value, collectionSize } = await portfolioSummary(u.sub, { priceAll: true })
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
  const computedAt = await db.putLeaderboardCache(leaders)
  return { leaders, computedAt }
}
