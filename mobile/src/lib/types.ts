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
  listing: Listing | null
  createdAt: string
  tier: Tier
  value: number
  likes?: number
}

export interface FeedItem extends Meme {
  likes: number
  likedByMe: boolean
  friendOwners: string[]
  friendLikers: string[]
  friendSignal: number
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

export interface HistoryPoint {
  at: string
  reshares: number
  value: number
}

export interface Alert {
  id: string
  type: 'tierup' | 'sale' | 'trade' | 'friend'
  message: string
  memeId: string | null
  read: boolean
  createdAt: string
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

export interface CreatorProfile {
  profile: {
    sub: string
    name: string
    picture: string | null
    followers: number
    collectionSize: number
    portfolioValue: number
    createdAt: string
  }
  followingByMe: boolean
  friendStatus: 'incoming' | 'outgoing' | 'accepted' | null
  created: Meme[]
  binder: (Meme & { shares: number })[]
}
