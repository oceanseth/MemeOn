import { cn } from './cn'

/** The small fixed grid the Invite screen keeps (the feeds are masonry now — see
 *  `organisms/masonry-grid.tsx`). `items-start`: fitted-frame cards differ in height,
 *  so a slot must not stretch its card to the row's tallest. */
export const binderGridClasses = cn(
  'm-0 grid list-none grid-cols-(--grid-binder) items-start gap-5 p-0',
  'max-sm:grid-cols-2 max-sm:gap-4.5',
)

/**
 * Skip-rendering box around a fixed-grid card. `skip-render` is the `@utility` in `index.css`;
 * `content-visibility` must not sit on the card itself — it would clip the foil bloom, which the
 * padding / negative-margin pair contains without moving the grid track. A one-cell grid, so the
 * card stretches to the slot.
 */
export const binderCardSlotClasses = cn(
  'skip-render grid',
  'pointer-events-none p-7.5 -m-7.5 *:pointer-events-auto',
  'max-sm:p-5 max-sm:-m-5',
)
