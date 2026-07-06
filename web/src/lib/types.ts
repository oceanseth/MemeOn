import type { Tier } from '../../../shared/tiers'

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
  myShares?: number
  isCreator?: boolean
}

export interface Position {
  memeId: string
  userId: string
  shares: number
}

export interface Me {
  sub: string
  name: string
  picture: string | null
  coins: number
  portfolioValue: number
  collectionSize: number
  unreadAlerts: number
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

export interface Alert {
  id: string
  type: 'tierup' | 'sale' | 'trade' | 'friend'
  message: string
  memeId: string | null
  read: boolean
  createdAt: string
}
