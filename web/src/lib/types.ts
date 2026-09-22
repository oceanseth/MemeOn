import type { Tier } from '@memeon/shared/tiers'
import type { Meme as MemeRecord } from '@memeon/shared/types'

export type { Listing } from '@memeon/shared/types'

export interface Meme extends MemeRecord {
  tier: Tier
  value: number
  /** total share-link loads (drives the tier ladder) */
  views?: number
  /** distinct external sources (uniqueRefs) — true reshares */
  reshareCount?: number
  myShares?: number
  isCreator?: boolean
}

export interface Memeplex {
  original: Meme | null
  ancestors: Meme[]
  remixes: Meme[]
  related: Meme[]
}

export interface Position {
  memeId: string
  userId: string
  shares: number
}

export type QuestKey = 'pack' | 'mint' | 'share' | 'friend' | 'trade'

export interface Me {
  sub: string
  name: string
  picture: string | null
  /** braincells — the plain number; the brain glyph is drawn by the Icon atom. Field name kept for wire compatibility. */
  coins: number
  portfolioValue: number
  collectionSize: number
  unreadAlerts: number
  onboarding?: Partial<Record<QuestKey, string>>
}

export interface QuestStep {
  key: QuestKey
  title: string
  reward: number
  hint: string
  done: boolean
}

export interface LeaderRow {
  sub: string
  name: string
  picture: string | null
  braincells: number
  portfolioValue: number
  collectionSize: number
}

export interface FriendEntry {
  sub: string
  name: string
  picture: string | null
  status: 'incoming' | 'outgoing' | 'accepted'
  collectionSize: number
  portfolioValue: number
}

export interface TradeSide {
  memes: { memeId: string; shares: number }[]
  /** braincells — the plain number; field name kept for wire compatibility */
  coins: number
}

export interface Trade {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  /** Wire: proposer's give. UI remaps to TradeCardModel.give (mine ? offer : ask). */
  offer: TradeSide
  /** Wire: proposer's get. UI remaps to TradeCardModel.get (mine ? ask : offer). */
  ask: TradeSide
  status: 'proposed' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  resolvedAt: string | null
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

export interface GiphyResult {
  id: string
  title: string
  stillUrl: string
  gifUrl: string
  mp4Url: string | null
  author: string | null
  url: string
}
