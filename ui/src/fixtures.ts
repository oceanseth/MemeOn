import type { Alert, Meme, Memeplex, NavUser, QuestStep, Tier } from './types'

/** Inline SVG art keeps stories deterministic and offline. */
export const art = (a: string, b: string, glyph: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>` +
      `</linearGradient></defs>` +
      `<rect width="320" height="320" fill="url(#g)"/>` +
      `<text x="160" y="200" font-size="120" text-anchor="middle">${glyph}</text></svg>`,
  )

export const TIERS: Record<string, Tier> = {
  paper: { key: 'paper', name: 'Paper', rarity: 'Common', minReshares: 0, baseValue: 0, color: '#a8b0bd', hype: '' },
  silver: { key: 'silver', name: 'Silver', rarity: 'Uncommon', minReshares: 10, baseValue: 25, color: '#c8d3e0', hype: '' },
  holo: { key: 'holo', name: 'Holo', rarity: 'Rare', minReshares: 50, baseValue: 60, color: '#7fd4ff', hype: '' },
  chrome: { key: 'chrome', name: 'Chrome', rarity: 'Ultra Rare', minReshares: 250, baseValue: 150, color: '#b8c6ff', hype: '' },
  gold: { key: 'gold', name: 'Gold', rarity: 'Secret Rare', minReshares: 1000, baseValue: 400, color: '#ffd76a', hype: '' },
  prismatic: { key: 'prismatic', name: 'Prismatic', rarity: 'Rainbow Rare', minReshares: 2500, baseValue: 700, color: '#c9a7ff', hype: '' },
  shiny: { key: 'shiny', name: 'Shiny', rarity: 'Full Art', minReshares: 5000, baseValue: 1200, color: '#ff9af5', hype: '' },
}

export function meme(over: Partial<Meme> = {}): Meme {
  return {
    id: 'mo_7f3a91',
    title: 'distracted boyfriend, but it is my side project',
    description: null,
    mediaType: 'image',
    imageUrl: art('#2b3358', '#5a3d7a', '🗿'),
    videoUrl: null,
    tags: ['classic', 'relatable'],
    creatorId: 'u_1',
    creatorName: 'grimace_enjoyer',
    ownerId: 'u_1',
    ownerName: 'grimace_enjoyer',
    reshares: 214,
    tierKey: 'holo',
    listing: null,
    createdAt: '2026-07-14T09:12:00.000Z',
    tier: TIERS.holo,
    value: 1840,
    views: 12403,
    reshareCount: 214,
    ...over,
  }
}

export const LADDER: Meme[] = [
  meme({ id: 'm1', tier: TIERS.paper, tierKey: 'paper', title: 'first post, be nice', value: 0, views: 38, reshareCount: 2, imageUrl: art('#3a3f4d', '#22262f', '📄') }),
  meme({ id: 'm2', tier: TIERS.silver, tierKey: 'silver', title: 'the group chat has noticed', value: 210, views: 940, reshareCount: 31, imageUrl: art('#6b7686', '#c8d3e0', '🥈') }),
  meme({ id: 'm3', tier: TIERS.holo, tierKey: 'holo' }),
  meme({ id: 'm4', tier: TIERS.chrome, tierKey: 'chrome', title: 'normies are sending it to their moms', value: 3100, views: 62110, reshareCount: 410, imageUrl: art('#4a5480', '#b8c6ff', '🪞') }),
  meme({ id: 'm5', tier: TIERS.gold, tierKey: 'gold', title: 'escaped containment at 3am', value: 9400, views: 288401, reshareCount: 1420, imageUrl: art('#7a5c1e', '#ffd76a', '🏆') }),
  meme({ id: 'm6', tier: TIERS.prismatic, tierKey: 'prismatic', title: 'the rainbow rare nobody expected', value: 18800, views: 512900, reshareCount: 3100, imageUrl: art('#3d2a6e', '#c9a7ff', '🌈') }),
  meme({ id: 'm7', tier: TIERS.shiny, tierKey: 'shiny', title: 'full art, no notes', value: 41200, views: 1204338, reshareCount: 8130, imageUrl: art('#5a2a6e', '#ff9af5', '✨') }),
]

export const BINDER: Meme[] = [
  meme({ id: 'b1', title: 'selling shares of my own cringe', myShares: 24, imageUrl: art('#1e3a4d', '#7fd4ff', '💸') }),
  meme({ id: 'b2', title: 'the group chat has noticed', myShares: 8, tier: TIERS.silver, tierKey: 'silver', imageUrl: art('#6b7686', '#c8d3e0', '🥈') }),
  meme({ id: 'b3', title: 'escaped containment at 3am', myShares: 3, tier: TIERS.gold, tierKey: 'gold', imageUrl: art('#7a5c1e', '#ffd76a', '🏆') }),
]

export const ALERTS: Alert[] = [
  { id: 'a1', type: 'tierup', message: '“full art, no notes” hit ✨Shiny✨', memeId: 'm7', read: false, createdAt: '2026-07-31T18:04:00.000Z' },
  { id: 'a2', type: 'sale', message: 'oxferd bought 12 shares of “escaped containment at 3am”', memeId: 'm5', read: false, createdAt: '2026-07-31T11:22:00.000Z' },
  { id: 'a3', type: 'friend', message: 'strong accepted your friend request', memeId: null, subjectSub: 'u_strong', read: true, createdAt: '2026-07-30T09:15:00.000Z' },
  { id: 'a4', type: 'trade', message: 'Your trade with grimace_enjoyer was declined', memeId: null, read: true, createdAt: '2026-07-29T21:40:00.000Z' },
]

export const QUESTS: QuestStep[] = [
  { key: 'pack', title: 'Open your starter pack', reward: 500, hint: 'Free shares to get you going', done: false },
  { key: 'mint', title: 'Mint a meme', reward: 250, hint: 'Upload or remix something', done: false },
  { key: 'share', title: 'Share it somewhere', reward: 250, hint: 'Reshares drive the tier ladder', done: false },
  { key: 'friend', title: 'Add a friend', reward: 100, hint: 'Trading needs friends', done: true },
  { key: 'trade', title: 'Make a trade', reward: 400, hint: 'Buy or sell shares', done: false },
]

export const MEMEPLEX: Memeplex = {
  original: LADDER[2],
  ancestors: [LADDER[2]],
  remixes: [LADDER[4], LADDER[6]],
  related: [LADDER[1]],
}

export const USER: NavUser = {
  sub: 'u_1',
  name: 'grimace_enjoyer',
  picture: art('#7fd4ff', '#ff9af5', '🧠'),
  coins: 12480,
}
