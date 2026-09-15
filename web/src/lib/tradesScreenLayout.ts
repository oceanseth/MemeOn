import { cn } from './cn'

/** A silent region spends none of its column's rhythm until it has something to say. */
export const liveRegion = cn('empty:sr-only [&:not(:empty)]:mb-4')

export const columnFields = cn('flex flex-col gap-2.5')

/** Give and want side by side at 2xl, stacked below. */
export const composeGrid = cn(
  'flex flex-col gap-5',
  'xl:grid xl:grid-cols-[repeat(2,minmax(0,1fr))] xl:gap-x-7 xl:gap-y-5',
  'xl:[&>*:not([data-slot=fieldset])]:col-span-full',
)

/** Composer legends at intro size, not micro caps. */
export const composeLegend = cn('mb-2.5 text-intro font-semibold tracking-normal text-foreground normal-case')

/** A stack of cards, evenly spaced. */
export const rowList = cn('flex flex-col gap-3.5')

/** Unbounded title — the section heading each list outside the composer sits under. */
export const listHeading = cn('m-0 font-display text-title font-medium tracking-title text-foreground')

export const headingRow = cn('mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1')

export const countNote = cn('text-small text-muted-foreground tabular-nums')

export const composerIntro = cn('m-0 mt-1.5 text-small font-medium text-muted-foreground')

export const proposeRow = cn('flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5')

export const proposeCaption = cn('text-small text-muted-foreground')
