import { memeValue, tierFor } from '../../shared/tiers'
import type {
  Alert,
  FriendEntry,
  GiphyResult,
  LeaderRow,
  Me,
  Meme,
  Memeplex,
  QuestStep,
  Trade,
} from '../src/lib/types'
import { devMemeMedia } from './dev-meme-media'

export const FIXED_NOW = '2026-09-08T00:00:00.000Z'

const media = devMemeMedia.roles

function meme(partial: Pick<Meme, 'id' | 'title' | 'reshares'> & Partial<Meme>): Meme {
  const tier = tierFor(partial.reshares)
  return {
    description: null,
    mediaType: 'image',
    imageUrl: media.paper.imageUrl,
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
    reshareCount: 0,
    remixOf: null,
    private: false,
    source: null,
    ...partial,
  }
}

/** Stable story ids/titles; art synced from dev.memeon.ai via sync-storybook-memes.mjs */
export const paperMeme = meme({
  id: 'meme-paper',
  title: 'fresh paper',
  reshares: 0,
  imageUrl: media.paper.imageUrl,
})
export const silverMeme = meme({
  id: 'meme-silver',
  title: 'group-chat silver',
  reshares: 12,
  imageUrl: media.silver.imageUrl,
})
export const holoMeme = meme({
  id: 'meme-holo',
  title: 'holo hit',
  reshares: 60,
  imageUrl: media.holo.imageUrl,
})
export const chromeMeme = meme({
  id: 'meme-chrome',
  title: media.chrome.title,
  reshares: media.chrome.reshares,
  imageUrl: media.chrome.imageUrl,
  creatorId: media.chrome.creatorId,
  creatorName: media.chrome.creatorName,
  ownerId: media.chrome.ownerId,
  ownerName: media.chrome.ownerName,
})
export const goldMeme = meme({
  id: 'meme-gold',
  title: media.gold.title,
  reshares: media.gold.reshares,
  imageUrl: media.gold.imageUrl,
  creatorId: media.gold.creatorId,
  creatorName: media.gold.creatorName,
  ownerId: media.gold.ownerId,
  ownerName: media.gold.ownerName,
})
export const prismaticMeme = meme({
  id: 'meme-prismatic',
  title: media.prismatic.title,
  reshares: media.prismatic.reshares,
  imageUrl: media.prismatic.imageUrl,
  creatorId: media.prismatic.creatorId,
  creatorName: media.prismatic.creatorName,
  ownerId: media.prismatic.ownerId,
  ownerName: media.prismatic.ownerName,
})
export const shinyMeme = meme({
  id: 'meme-shiny',
  title: media.shiny.title,
  reshares: media.shiny.reshares,
  imageUrl: media.shiny.imageUrl,
  creatorId: media.shiny.creatorId,
  creatorName: media.shiny.creatorName,
  ownerId: media.shiny.ownerId,
  ownerName: media.shiny.ownerName,
})
export const listedHolo = meme({
  id: 'meme-listed',
  title: 'listed holo',
  reshares: 60,
  imageUrl: media.holo.imageUrl,
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

export const videoMeme: Meme = meme({
  id: 'meme-video',
  title: media.video.title,
  reshares: media.video.reshares,
  mediaType: 'video',
  imageUrl: media.video.imageUrl,
  videoUrl: media.video.videoUrl,
  creatorId: media.video.creatorId,
  creatorName: media.video.creatorName,
  ownerId: media.video.ownerId,
  ownerName: media.video.ownerName,
})

export const giphyCat: GiphyResult = {
  id: 'giphy-cat',
  title: 'cat keyboard',
  stillUrl: media.video.imageUrl,
  gifUrl: media.video.imageUrl,
  mp4Url: media.video.videoUrl,
  author: 'giphy-user',
  url: 'https://giphy.com/gifs/cat-keyboard',
}

export const giphyDog: GiphyResult = {
  id: 'giphy-dog',
  title: 'dog office',
  stillUrl: media.paper.imageUrl,
  gifUrl: media.paper.imageUrl,
  mp4Url: null,
  author: null,
  url: 'https://giphy.com/gifs/dog-office',
}

export const giphyCategories = ['reactions', 'animals', 'memes']

export const tierFrames: Record<string, string> = devMemeMedia.frames

export const invitePal = {
  inviter: {
    sub: friendAccepted.sub,
    name: friendAccepted.name,
    picture: friendAccepted.picture,
    followers: 4,
    collectionSize: friendAccepted.collectionSize,
    portfolioValue: friendAccepted.portfolioValue,
  },
  topMemes: [paperMeme, silverMeme, holoMeme],
}

export const inviteLou = {
  inviter: {
    sub: meLou.sub,
    name: meLou.name,
    picture: meLou.picture,
    followers: 2,
    collectionSize: meLou.collectionSize,
    portfolioValue: meLou.portfolioValue,
  },
  topMemes: [paperMeme],
}

export const developerKeys = [
  { prefix: 'mo_live_abcd', label: 'my-trading-bot', createdAt: FIXED_NOW },
  { prefix: 'mo_live_efgh', label: 'my key', createdAt: FIXED_NOW },
]

export const discordInstallUrl = 'https://discord.com/oauth2/authorize'

export const leaderboardRows: LeaderRow[] = [
  {
    sub: friendAccepted.sub,
    name: friendAccepted.name,
    picture: friendAccepted.picture,
    collectionSize: friendAccepted.collectionSize,
    portfolioValue: friendAccepted.portfolioValue,
    braincells: 240,
  },
  {
    sub: meLou.sub,
    name: meLou.name,
    picture: meLou.picture,
    collectionSize: meLou.collectionSize,
    portfolioValue: meLou.portfolioValue,
    braincells: meLou.coins,
  },
]
