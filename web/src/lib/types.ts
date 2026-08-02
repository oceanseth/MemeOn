// The design system owns the view types it renders — one definition, in
// @memeon/ui. App-only shapes (Me, Trade, LeaderRow…) stay here.
export type {
  Tier,
  Listing,
  Meme,
  Memeplex,
  QuestKey,
  QuestStep,
  Alert,
  NavUser,
} from '@memeon/ui'
import type { QuestKey } from '@memeon/ui'

export interface Position {
  memeId: string
  userId: string
  shares: number
}

export interface Me {
  sub: string
  name: string
  picture: string | null
  /** braincells 🧠 */
  coins: number
  portfolioValue: number
  collectionSize: number
  unreadAlerts: number
  onboarding?: Partial<Record<QuestKey, string>>
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
  coins: number
}

export interface Trade {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  offer: TradeSide
  ask: TradeSide
  status: 'proposed' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  resolvedAt: string | null
}

