const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * The tier half of the foil API — `tier-<key> [sheen] [sparkle]`; `foil.css` implements those
 * class names. `sheen` drives the collectible rail sweep; `sheen` and `sparkle` pick the
 * forced-colors ladder rung. Only `foil-frame.tsx` imports this.
 */
export function tierFrameClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `foil-card tier-${tierKey}${sheen}${sparkle}`
}
