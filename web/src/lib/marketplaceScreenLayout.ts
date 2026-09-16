import { cn } from './cn'
import { buttonClasses } from '@/atoms/button'

/**
 * The control plate docks under the topbar while the grid scrolls. It bleeds only into the page
 * container's own gutter (`-mx-page-x px-page-x`). A phone has no vertical budget to pin filters,
 * so ≤720 the whole treatment is absent.
 */
export const marketControls = cn(
  'flex flex-col gap-3.5 pt-0 pb-3.5',
  /* it docks under the phone header (`--topbar-h`); at the shell breakpoint that height is 0, so
     the plate takes the sidebar's own `page-x` inset instead of the viewport edge */
  'lg:docked lg:-mx-page-x lg:px-page-x',
  'xl:top-5',
)

/** Search well, phone disclosure pills, and Mint — stacked on phone, one row on desktop. */
export const marketToolbar = cn('flex flex-wrap items-center gap-3')

/* search icon at 18px gutter → 50px input padding (18 + 20 + 12) */
export const searchWell = cn('relative flex w-full min-w-0 flex-1 lg:max-w-search')
export const searchGlyph = cn('pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-muted-foreground')

/** Toolbar Mint: bubblegum on phone, neutral raised on desktop (sidebar owns primary). */
export const mintLink = cn(
  buttonClasses('primary'),
  'w-full lg:w-51.5 lg:bg-accent lg:text-foreground',
)

/** The pre-ox/ui grid: 4-up ~262 at the 1108 column (`minmax(230px, 1fr)`), 2-up 166 on the phone. */
export const cardGrid = cn(
  'm-0 grid list-none items-start gap-5 p-0',
  'grid-cols-[repeat(auto-fill,minmax(230px,1fr))]',
  'max-sm:grid-cols-2 max-sm:gap-gutter',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it
 * would clip the foil bloom, which the padding / negative-margin pair contains without moving the
 * grid track.
 */
export const cardSlot = cn(
  'skip-render',
  'pointer-events-none p-bloom -m-bloom *:pointer-events-auto',
  'max-sm:p-page-x max-sm:-m-page-x',
)

/** Results / Count: the section heading left, the live count right, on one baseline. */
export const resultsRow = cn('mt-1 mb-gutter flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2')
export const sectionHeading = cn('m-0 font-display text-3xl font-normal text-foreground max-md:text-2xl')
export const summaryRow = cn('flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground')

/**
 * A small button keeps an explicit height: the pill is 46 tall now, and padding no longer shrinks
 * it. 36 is the drawn size; a coarse pointer still gets the 44 a finger needs.
 */
export const chipButton = cn('h-9 px-3 text-xs pointer-coarse:min-h-hit')

export const searchInput = cn('w-full pl-12.5')

export const marketDisclosures = cn('flex w-full gap-3 lg:hidden')

export const marketFilters = cn('flex flex-col gap-3 max-lg:data-[collapsed=true]:hidden')

export const filterRow = cn('flex flex-wrap items-center gap-3')

export const endOfList = cn('pt-8 text-sm')

/** Tier filter as a raised pill — same material as neighbours, not a recessed form Select. */
export const tierPill = cn(
  'h-control rounded-lg material-raised px-4.5 font-semibold',
  'lift',
)
