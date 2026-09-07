import { memeValue, tierFor } from '../../shared/tiers'
import type { Alert, FriendEntry, Me, Meme, Trade } from '../src/lib/types'

export const FIXED_NOW = '2026-09-08T00:00:00.000Z'

function meme(partial: Pick<Meme, 'id' | 'title' | 'reshares'> & Partial<Meme>): Meme {
  const tier = tierFor(partial.reshares)
  return {
    description: null,
    mediaType: 'image',
    imageUrl: '/brand/og-home.png',
    videoUrl: null,
    tags: [],
    creatorId: 'user-lou',
    creatorName: 'lou',
    ownerId: 'user-lou',
    ownerName: 'lou',
    listing: null,
    createdAt: FIXED_NOW,
    tier,
    tierKey: tier.key,
    value: memeValue(partial.reshares),
    views: partial.reshares,
    reshareCount: partial.reshares,
    remixOf: null,
    private: false,
    source: null,
    ...partial,
  }
}

export const paperMeme = meme({ id: 'meme-paper', title: 'fresh paper', reshares: 0 })
export const silverMeme = meme({ id: 'meme-silver', title: 'group-chat silver', reshares: 12 })
export const holoMeme = meme({ id: 'meme-holo', title: 'holo hit', reshares: 60 })
export const listedHolo = meme({
  id: 'meme-listed',
  title: 'listed holo',
  reshares: 60,
  listing: { sellerId: 'user-lou', pricePerShare: 3, shares: 10 },
})

export const meLou: Me = {
  sub: 'user-lou',
  name: 'lou',
  picture: null,
  coins: 120,
  portfolioValue: 40,
  collectionSize: 3,
  unreadAlerts: 1,
  onboarding: { pack: 'done', mint: 'done' },
}

export const friendAccepted: FriendEntry = {
  sub: 'user-pal',
  name: 'pal',
  picture: null,
  status: 'accepted',
  collectionSize: 8,
  portfolioValue: 90,
}

export const proposedTrade: Trade = {
  id: 'trade-1',
  fromId: 'user-lou',
  fromName: 'lou',
  toId: 'user-pal',
  toName: 'pal',
  offer: { memes: [{ memeId: paperMeme.id, shares: 5 }], coins: 0 },
  ask: { memes: [{ memeId: silverMeme.id, shares: 2 }], coins: 10 },
  status: 'proposed',
  createdAt: FIXED_NOW,
  resolvedAt: null,
}

export const unreadSale: Alert = {
  id: 'alert-1',
  type: 'sale',
  message: 'someone bought 2 shares',
  memeId: listedHolo.id,
  read: false,
  createdAt: FIXED_NOW,
}

export const marketplacePage = [paperMeme, silverMeme, holoMeme, listedHolo]
