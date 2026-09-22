export interface UserProfile {
  sub: string
  name: string
  nameLower: string
  picture: string | null
  /** braincells 🧠 (field name kept for data compatibility) */
  coins: number
  createdAt: string
  /** onboarding quest completion timestamps */
  onboarding?: Partial<Record<'pack' | 'mint' | 'share' | 'friend' | 'trade', string>>
  followers?: number
}

export type { Listing, Meme } from '@memeon/shared/types'

export interface CreatorClaim {
  memeId: string
  userId: string
  userName: string
  note: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Position {
  memeId: string
  userId: string
  shares: number
}

export type FriendStatus = 'incoming' | 'outgoing' | 'accepted'

export interface Friend {
  userId: string
  otherId: string
  status: FriendStatus
  createdAt: string
}

export interface TradeSide {
  /** meme shares included on this side */
  memes: { memeId: string; shares: number }[]
  coins: number
}

export type TradeStatus = 'proposed' | 'accepted' | 'declined' | 'cancelled'

export interface Trade {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  offer: TradeSide
  ask: TradeSide
  status: TradeStatus
  createdAt: string
  resolvedAt: string | null
}

export type AlertType = 'tierup' | 'sale' | 'trade' | 'friend'

export interface Alert {
  id: string
  userId: string
  type: AlertType
  message: string
  memeId: string | null
  /** when set, the alert links to this user's profile */
  subjectSub?: string | null
  read: boolean
  createdAt: string
}
