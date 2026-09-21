import { cn } from './cn'

/** Sheet min track is 232px (`--grid-binder`); 2 × 166 + 18 = 350 at the phone margin.
 *  No `items-start`: every slot takes its row, so every card in the row is one size. */
export const binderGridClasses = cn(
  'm-0 grid list-none grid-cols-(--grid-binder) gap-5 p-0',
  'max-sm:grid-cols-2 max-sm:gap-4.5',
)

/**
 * Skip-rendering box around a card. `skip-render` is the `@utility` in `index.css`;
 * `content-visibility` must not sit on the card itself — it would clip the foil bloom, which the
 * padding / negative-margin pair contains without moving the grid track. A one-cell grid, so the
 * card stretches to the slot as the slot does to its row.
 */
export const binderCardSlotClasses = cn(
  'skip-render grid',
  'pointer-events-none p-7.5 -m-7.5 *:pointer-events-auto',
  'max-sm:p-5 max-sm:-m-5',
)
