const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * The tier half of the foil API — `tier-<key> [sheen] [sparkle]` — paired with
 * `data-glow-style={glowStyleFor(tierKey)}` on the same element; `foil.css` implements those class
 * names. The 3px frame is a real border on the image frame (`foil-frame`), so the card itself only
 * needs the tier's variables and the two bounded effects. Only `foil-frame.tsx` imports this.
 */
export function tierFrameClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `foil-card tier-${tierKey}${sheen}${sparkle}`
}
