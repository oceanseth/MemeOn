/**
 * Virality tiers — the pokemon-card-style rarity ladder a meme climbs as it gets
 * reshared. A meme's tier is derived purely from its reshare count, so the same
 * thresholds must be used by the API (og frames, alerts) and the web (FAQ, cards).
 */
export interface Tier {
  /** stable key; also the frame asset name (frames/{key}.png) */
  key: string
  /** display name */
  name: string
  /** rarity label, pokemon-card flavored */
  rarity: string
  /** minimum reshares (inclusive) to hold this tier */
  minReshares: number
  /** base coin value of a full (100-share) meme at this tier */
  baseValue: number
  /** accent color used for CSS fallbacks and borders */
  color: string
  /** hype copy shown in the FAQ */
  hype: string
}

export const TIERS: Tier[] = [
  {
    key: 'paper',
    name: 'Paper',
    rarity: 'Common',
    minReshares: 0,
    baseValue: 10,
    color: '#a8b0bd',
    hype: 'Fresh off the press. Every legend starts as a humble shitpost.',
  },
  {
    key: 'silver',
    name: 'Silver',
    rarity: 'Uncommon',
    minReshares: 10,
    baseValue: 25,
    color: '#c8d3e0',
    hype: 'The group chats have noticed. A silver-stamped contender.',
  },
  {
    key: 'holo',
    name: 'Holo',
    rarity: 'Rare',
    minReshares: 50,
    baseValue: 60,
    color: '#7fd4ff',
    hype: 'Holographic shimmer unlocked. This one is escaping containment.',
  },
  {
    key: 'chrome',
    name: 'Chrome',
    rarity: 'Ultra Rare',
    minReshares: 250,
    baseValue: 150,
    color: '#b8c6ff',
    hype: 'Full-art chrome. Normies are starting to send it to their moms.',
  },
  {
    key: 'gold',
    name: 'Gold',
    rarity: 'Legendary',
    minReshares: 1000,
    baseValue: 400,
    color: '#ffd76a',
    hype: 'Gold foil legendary. Brands are ruining it as we speak.',
  },
  {
    key: 'prismatic',
    name: 'Prismatic',
    rarity: 'Secret Rare',
    minReshares: 5000,
    baseValue: 1000,
    color: '#ff9af5',
    hype: 'Prismatic secret rare. Screenshotted, reposted, tattooed on strangers.',
  },
  {
    key: 'shiny',
    name: 'Shiny',
    rarity: 'Mythic Shiny',
    minReshares: 25000,
    baseValue: 2500,
    color: '#9fffe0',
    hype: '✨ MYTHIC SHINY ✨ A once-in-a-generation cultural event.',
  },
]

/** Index into TIERS for a given reshare count. */
export function tierIndexFor(reshares: number): number {
  let idx = 0
  for (let i = 0; i < TIERS.length; i++) {
    if (reshares >= TIERS[i].minReshares) idx = i
  }
  return idx
}

export function tierFor(reshares: number): Tier {
  return TIERS[tierIndexFor(reshares)]
}

/**
 * Current coin value of a full meme: tier base value plus a small kicker for
 * progress toward the next tier, so value moves with every reshare.
 */
export function memeValue(reshares: number): number {
  const idx = tierIndexFor(reshares)
  const tier = TIERS[idx]
  const next = TIERS[idx + 1]
  if (!next) return tier.baseValue + Math.floor(Math.sqrt(Math.max(0, reshares - tier.minReshares)))
  const span = next.minReshares - tier.minReshares
  const progress = (reshares - tier.minReshares) / span
  return Math.round(tier.baseValue + (next.baseValue - tier.baseValue) * progress * 0.5)
}
