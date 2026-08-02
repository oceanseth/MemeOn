/**
 * View-model types the design system renders.
 *
 * `Tier` is duplicated structurally from `shared/tiers.ts` on purpose: the api
 * depends on `shared/`, so the UI package must not own it, and the UI package
 * must not depend on app code either. `web/src/lib/tier-compat.ts` asserts the
 * two stay assignable, so drift fails the typecheck instead of at runtime.
 */
export interface Tier {
  /** stable key; also the frame asset name (frames/{key}.png) */
  key: string
  /** display name */
  name: string
  /** rarity label, pokemon-card flavored */
  rarity: string
  /** minimum reshares (inclusive) to hold this tier */
  minReshares: number
  /** base coin value of a full (100-share) meme at this tier */
  baseValue: number
  /** accent color used for CSS fallbacks and borders */
  color: string
  /** hype copy shown in the FAQ */
  hype: string
}

export interface Listing {
  sellerId: string
  pricePerShare: number
  shares: number
}

export interface Meme {
  id: string
  title: string
  description: string | null
  mediaType: 'image' | 'video'
  imageUrl: string
  videoUrl: string | null
  tags: string[]
  creatorId: string
  creatorName: string
  ownerId: string
  ownerName: string
  reshares: number
  tierKey: string
  listing: Listing | null
  createdAt: string
  tier: Tier
  value: number
  /** total share-link loads (drives the tier ladder) */
  views?: number
  /** distinct external sources — true reshares */
  reshareCount?: number
  myShares?: number
  isCreator?: boolean
  remixOf?: string | null
  private?: boolean
  source?: { provider: string; id: string; url: string; author: string | null } | null
}

export interface Memeplex {
  original: Meme | null
  ancestors: Meme[]
  remixes: Meme[]
  related: Meme[]
}

export type QuestKey = 'pack' | 'mint' | 'share' | 'friend' | 'trade'

export interface QuestStep {
  key: QuestKey
  title: string
  reward: number
  hint: string
  done: boolean
}

export interface Alert {
  id: string
  type: 'tierup' | 'sale' | 'trade' | 'friend'
  message: string
  memeId: string | null
  subjectSub?: string | null
  read: boolean
  createdAt: string
}

/** The subset of the signed-in user the chrome renders. */
export interface NavUser {
  sub: string
  name: string
  picture: string | null
  /** braincells 🧠 */
  coins: number
}
