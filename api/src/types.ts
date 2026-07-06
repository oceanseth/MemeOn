export interface UserProfile {
  sub: string
  name: string
  nameLower: string
  picture: string | null
  coins: number
  createdAt: string
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
  /** primary still image (card art / og compositing source) */
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
  read: boolean
  createdAt: string
}
