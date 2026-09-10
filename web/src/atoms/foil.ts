const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * The foil effect API: `glow-border tier-<key> [sheen] [sparkle]`, paired with
 * `data-glow-style={glowStyleFor(tierKey)}` on the same element. `foil.css` implements those
 * class names. This module is the dependency-free half of the seam — no React import — so a
 * code-split route (`screens/CreateMemeScreen.tsx`'s mint preview, behind `views/CreateMemeView`'s
 * `lazy()`) can pull in `tierClasses` without dragging `atoms/MemeCard.tsx`, `Badge` and
 * `react-router-dom`'s `Link` onto its critical path. `atoms/MemeCard.tsx` re-exports `tierClasses`
 * for compatibility; `screens/LandingScreen.tsx` and `hooks/useCreateMemeScreen.ts` import it
 * directly from here.
 */
export function tierClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `glow-border tier-${tierKey}${sheen}${sparkle}`
}

export { SHEEN_TIERS }
