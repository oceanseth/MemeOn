const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * The tier half of the foil API — `tier-<key> [sheen] [sparkle]` — without the `glow-border`
 * padding frame. This is what a Soft Press card wants: the 3px frame is a real border on the
 * image frame (`foil-frame`), so the card itself only needs the tier's variables and the two
 * bounded effects. `atoms/MemeCard.tsx` is the caller.
 */
export function tierFrameClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `foil-card tier-${tierKey}${sheen}${sparkle}`
}

/**
 * The foil effect API: `glow-border tier-<key> [sheen] [sparkle]`, paired with
 * `data-glow-style={glowStyleFor(tierKey)}` on the same element. `foil.css` implements those
 * class names. This module is the dependency-free half of the seam — no React import — so a
 * code-split route (`screens/CreateMemeScreen.tsx`'s mint preview, behind `views/CreateMemeView`'s
 * `lazy()`) can pull in `tierClasses` without dragging `atoms/MemeCard.tsx` and `react-router-dom`'s
 * `Link` onto its critical path. `atoms/MemeCard.tsx` re-exports `tierClasses` for compatibility;
 * `screens/LandingScreen.tsx` and `hooks/useCreateMemeScreen.ts` import it directly from here.
 *
 * `glow-border` is the *legacy padding frame*: a host that paints its tier frame as
 * `p-(--glow-width)` around an inner box, with an animated conic ring over it. Soft Press puts the
 * frame on the art instead — see {@link tierFrameClasses}.
 */
export function tierClasses(tierKey: string): string {
  return `glow-border ${tierFrameClasses(tierKey)}`
}

export { SHEEN_TIERS }
