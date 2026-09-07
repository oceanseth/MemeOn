import { memeValue, tierFor } from '../../shared/tiers'
import type { Alert, FriendEntry, Me, Meme, Memeplex, QuestStep, Trade } from '../src/lib/types'

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

export const readSale: Alert = { ...unreadSale, id: 'alert-2', read: true }

export const unreadFriend: Alert = {
  id: 'alert-3',
  type: 'friend',
  message: 'pal accepted your friend request',
  memeId: null,
  subjectSub: 'user-pal',
  read: false,
  createdAt: FIXED_NOW,
}

export const giftablePaper: Meme = { ...paperMeme, myShares: 12 }
export const giftableSilver: Meme = { ...silverMeme, myShares: 4 }

export const memeplexFamily: Memeplex = {
  original: paperMeme,
  ancestors: [paperMeme],
  remixes: [silverMeme],
  related: [holoMeme],
}

export const memeplexEmpty: Memeplex = {
  original: null,
  ancestors: [],
  remixes: [],
  related: [],
}

export const questStepsFresh: QuestStep[] = [
  {
    key: 'pack',
    title: 'Claim your starter pack',
    reward: 20,
    hint: 'Crack open a free pack of meme shares from the MemeOn Vault.',
    done: false,
  },
  {
    key: 'mint',
    title: 'Mint your first meme',
    reward: 100,
    hint: 'Generate, remix, or upload — your first card earns big.',
    done: false,
  },
  {
    key: 'share',
    title: 'Get your first reshare',
    reward: 50,
    hint: 'Share a meme you minted anywhere — the first link hit pays out.',
    done: false,
  },
  {
    key: 'friend',
    title: 'Make a friend',
    reward: 25,
    hint: 'Invite someone or accept a request.',
    done: false,
  },
  {
    key: 'trade',
    title: 'Complete a trade or purchase',
    reward: 25,
    hint: 'Buy shares or close a trade — welcome to the market.',
    done: false,
  },
]

export const questStepsPackDone: QuestStep[] = questStepsFresh.map((s) =>
  s.key === 'pack' ? { ...s, done: true } : s,
)

export const marketplacePage = [paperMeme, silverMeme, holoMeme, listedHolo]
