import type { Meme, Position } from './types'

/** Bounded per-route gate for the detail memeplex binder request. */
export function createDetailBinderGate() {
  const attempts = new Set<string>()
  return {
    shouldLoad(meme: Meme | null, positions: readonly Position[], userId: string | null): boolean {
      if (!meme || !userId) return false
      const shares = positions.find((position) => position.userId === userId)?.shares ?? 0
      if (meme.creatorId !== userId && shares <= 0) return false
      const attempt = `${meme.id}:${userId}`
      if (attempts.has(attempt)) return false
      attempts.add(attempt)
      return true
    },
  }
}
