const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * The tier half of the foil API — `tier-<key> [sheen] [sparkle]` — paired with
 * `data-glow-style={glowStyleFor(tierKey)}` on the same element; `foil.css` implements those class
 * names. The 3px frame is a real border on the image frame (`foil-frame`), so the card itself only
 * needs the tier's variables and the two bounded effects. This module is the dependency-free half
 * of the seam — no React import — so a code-split route (`screens/CreateMemeScreen.tsx`'s mint
 * preview, behind `views/CreateMemeView`'s `lazy()`) can pull in `tierFrameClasses` without
 * dragging `atoms/MemeCard.tsx` and `react-router-dom`'s `Link` onto its critical path.
 * `atoms/MemeCard.tsx`, `screens/LandingScreen.tsx` and `hooks/useCreateMemeScreen.ts` all import
 * `tierFrameClasses` directly from here.
 */
export function tierFrameClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `foil-card tier-${tierKey}${sheen}${sparkle}`
}
