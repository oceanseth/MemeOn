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
  /** named animated border profile used by web card surfaces */
  glowStyle: GlowBorderStyle
  /** hype copy shown in the FAQ */
  hype: string
}

export type GlowBorderStyle =
  | 'graphite-gradient-still'
  | 'silver-highlight-still'
  | 'cyan-magenta-gradient-drift'
  | 'silver-single-beam-chase'
  | 'gold-gradient-counter-sweep'
  | 'rainbow-gradient-drift'
  | 'mint-gold-highlight-orbit'

export const TIERS: Tier[] = [
  {
    key: 'paper',
    name: 'Paper',
    rarity: 'Common',
    // value starts at zero: an unshared meme is worth exactly nothing (yet)
    minReshares: 0,
    baseValue: 0,
    color: '#a8b0bd',
    glowStyle: 'graphite-gradient-still',
    hype: 'Fresh off the press. Every legend starts as a humble shitpost.',
  },
  {
    key: 'silver',
    name: 'Silver',
    rarity: 'Uncommon',
    minReshares: 10,
    baseValue: 25,
    color: '#c8d3e0',
    glowStyle: 'silver-highlight-still',
    hype: 'The group chats have noticed. A silver-stamped contender.',
  },
  {
    key: 'holo',
    name: 'Holo',
    rarity: 'Rare',
    minReshares: 50,
    baseValue: 60,
    color: '#7fd4ff',
    glowStyle: 'cyan-magenta-gradient-drift',
    hype: 'Holographic shimmer unlocked. This one is escaping containment.',
  },
  {
    key: 'chrome',
    name: 'Chrome',
    rarity: 'Ultra Rare',
    minReshares: 250,
    baseValue: 150,
    color: '#b8c6ff',
    glowStyle: 'silver-single-beam-chase',
    hype: 'Full-art chrome. Normies are starting to send it to their moms.',
  },
  {
    key: 'gold',
    name: 'Gold',
    rarity: 'Legendary',
    minReshares: 1000,
    baseValue: 400,
    color: '#ffd76a',
    glowStyle: 'gold-gradient-counter-sweep',
    hype: 'Gold foil legendary. Brands are ruining it as we speak.',
  },
  {
    key: 'prismatic',
    name: 'Prismatic',
    rarity: 'Secret Rare',
    minReshares: 5000,
    baseValue: 1000,
    color: '#ff9af5',
    glowStyle: 'rainbow-gradient-drift',
    hype: 'Prismatic secret rare. Screenshotted, reposted, tattooed on strangers.',
  },
  {
    key: 'shiny',
    name: 'Shiny',
    rarity: 'Mythic Shiny',
    minReshares: 25000,
    baseValue: 2500,
    color: '#9fffe0',
    glowStyle: 'mint-gold-highlight-orbit',
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

/** Named glow-border profile for a tier key, with a safe Paper fallback. */
export function glowStyleFor(tierKey: string): GlowBorderStyle {
  return TIERS.find((tier) => tier.key === tierKey)?.glowStyle ?? TIERS[0].glowStyle
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
