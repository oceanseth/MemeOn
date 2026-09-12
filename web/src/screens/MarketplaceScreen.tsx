import { Link } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState, PageState } from '../atoms/EmptyState'
import { Icon } from '../atoms/Icon'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Select, type SelectOption } from '../atoms/Select'
import { SkeletonCard } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { SortChips } from '../molecules/SortChips'

const TIER_ITEMS: readonly SelectOption[] = [
  { value: '', label: 'All tiers' },
  ...TIERS.map((tier) => ({ value: tier.key, label: tier.name })),
]

/** The board's page introduction (`Marketplace · Desktop · light · Central`, Page / Introduction). */
const INTRO = 'Find your next group-chat obsession.'

/** The board's section heading over the grid (Results / Count). */
const SECTION = 'The good stuff'

/**
 * The control plate docks under the topbar while the grid scrolls. It bleeds only into the page
 * container's own 20px gutter (`-mx-5 px-5`) — a viewport bleed painted across the sidebar gap and
 * was only kept off the navigation by z-index (WP2c). A phone has no vertical budget to pin
 * filters, so ≤720 the whole treatment is simply absent.
 */
const marketControls = cn(
  'flex flex-col gap-3.5 pt-0 pb-3.5',
  /* it docks under the phone header (`--topbar-h`); at the shell breakpoint that height is 0, so
     the plate takes the sidebar's own 20px inset instead of the viewport edge */
  'lg:sticky lg:top-(--topbar-h) lg:z-(--z-sticky) lg:-mx-5 lg:px-5',
  '2xl:top-5',
  'lg:bg-[color-mix(in_oklab,var(--color-canvas)_92%,transparent)] lg:backdrop-blur-[10px]',
)

/**
 * One wrapping row: the 540 search well, the phone's two disclosure pills and the Mint pill. On a
 * phone every item takes the full 350 column, so the row reads as the board's three stacked rows;
 * at ≥721 the disclosures are gone and search + Mint share one line.
 */
const marketToolbar = 'flex flex-wrap items-center gap-3'

/* The magnifying glass the board draws inside the well: 20px at the well's 18px gutter, with the
   12px gap it leaves before the value (18 + 20 + 12 = 50). */
const searchWell = 'relative flex w-full min-w-0 flex-1 lg:max-w-[540px]'
const searchGlyph = 'pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-ink-muted'

/**
 * The toolbar Mint is the phone's one primary (there is no sidebar down there) and a NEUTRAL raised
 * pill on the desktop board, where the sidebar's Mint pill owns the bubblegum. 206 wide, as drawn.
 */
const mintLink = cn(
  buttonClasses('primary'),
  'w-full lg:w-[206px] lg:bg-surface-raised lg:text-ink',
)

/** The grid: 3-up 356 at the 1108 column, 2-up 166 on the phone, one fluid ladder in between. */
const cardGrid = cn(
  'm-0 grid list-none gap-5 p-0',
  'grid-cols-[repeat(auto-fill,minmax(230px,1fr))]',
  '4xl:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]',
  'max-sm:grid-cols-2 max-sm:gap-[18px]',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it
 * would clip the foil bloom, which the padding / negative-margin pair contains without moving the
 * grid track.
 */
const cardSlot = cn(
  '[content-visibility:auto] [contain-intrinsic-size:auto_382px]',
  'pointer-events-none p-[30px] [margin:-30px] [&>*]:pointer-events-auto',
  'max-sm:p-5 max-sm:[margin:-20px]',
)

/** Results / Count: the section heading left, the live count right, on one baseline. */
const resultsRow = 'mt-1 mb-[18px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2'
const sectionHeading = 'm-0 font-display text-title font-medium tracking-title text-ink'
const summaryRow = 'flex flex-wrap items-center gap-2.5 text-small text-ink-muted'

/**
 * A small button keeps an explicit height: the pill is 46 tall now, and padding no longer shrinks
 * it. 36 is the drawn size; a coarse pointer still gets the 44 a finger needs.
 */
const chipButton = 'h-9 px-3 text-micro pointer-coarse:min-h-11'

/**
 * The eight tiers are the one filter a row of pills cannot hold, so the board keeps a control with
 * a ▾ for them (`6XC-0`'s fifth pill, "All tiers ▾") — but draws it as the same 46px RAISED pill as
 * its four neighbours, not as the recessed well `Select` wears inside a form. The material is the
 * only thing overridden; the popup, the sizer and every state stay the atom's.
 */
const tierPill = cn(
  'h-[46px] rounded-control bg-surface-raised px-[18px] font-semibold shadow-raised',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px',
  'motion-reduce:hover:translate-y-0!',
)

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  cards, queryInputProps, filterTabs, tierSelectProps, sortChips,
  createLinkProps, filtersToggleProps, filtersToggleLabel, filtersPanelProps, statusProps,
  resultsLabel, clearFiltersProps, showLoading, showEmpty, showError, showGrid, showMore,
  skeletonCount, errorMessage, retryButtonProps, retryLabel, loadMoreProps, loadMoreLabel,
  loadMoreError, endOfListLabel, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title="Marketplace" subtitle={INTRO} className="mb-3.5" />
      <div data-slot="market-controls" className={marketControls}>
        <div data-slot="market-toolbar" className={marketToolbar}>
          <span className={searchWell}>
            <Icon name="magnifying-glass" size={20} className={searchGlyph} />
            <Input type="search" className="w-full pl-[50px]" {...queryInputProps} />
          </span>
          {/* the phone's two disclosure pills: "you are here" on the left, the panel toggle right.
              While the panel is open this pill and the media row's own "All memes" tab are both on
              screen, so the one that actually does something says so in its name. */}
          <div data-slot="market-disclosures" className="flex w-full gap-3 lg:hidden">
            <Button
              className="flex-1"
              pressed={!clearFiltersProps}
              {...(clearFiltersProps
                ? { onClick: clearFiltersProps.onClick, 'aria-label': 'All memes, clear every filter' }
                : {})}
            >
              All memes
            </Button>
            <Button className="flex-1" data-slot="market-filters-toggle" {...filtersToggleProps}>
              {filtersToggleLabel}
            </Button>
          </div>
          <Link {...createLinkProps} className={mintLink}>＋ Mint a meme</Link>
        </div>
        {/* on phones the filter rows collapse behind the disclosure so the grid starts on the first screenful */}
        <div
          data-slot="market-filters"
          className="flex flex-col gap-3 max-lg:data-[collapsed=true]:hidden"
          {...filtersPanelProps}
        >
          {/* the board's `Filters / Pressed tabs` row: All memes · Images · Videos · For sale ·
              All tiers ▾, 46px pills 12 apart, the current one pressed into the surface */}
          <FilterBar className="gap-3">
            <div {...filterTabs.mediaGroupProps} className="flex flex-wrap items-center gap-3">
              {filterTabs.media.map((tab) => (
                <Button key={tab.key} {...tab.buttonProps}>{tab.label}</Button>
              ))}
            </div>
            <Button {...filterTabs.listed.buttonProps}>{filterTabs.listed.label}</Button>
            <Select items={TIER_ITEMS} className={tierPill} {...tierSelectProps} />
          </FilterBar>
          <SortChips model={sortChips} />
        </div>
      </div>
      <div className={resultsRow}>
        <h2 className={sectionHeading}>{SECTION}</h2>
        {/* one status line: the count doubles as the live region, and the state card owns the error copy */}
        <div data-slot="market-summary" className={summaryRow} {...statusProps}>
          <span>{resultsLabel}</span>
          {clearFiltersProps && !showEmpty && (
            <Button className={chipButton} {...clearFiltersProps}>Clear filters</Button>
          )}
        </div>
      </div>
      {showLoading ? (
        <div className={cardGrid} aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, slot) => (
            <SkeletonCard key={slot} />
          ))}
        </div>
      ) : showError ? (
        <EmptyState error>
          <h2>Couldn't load the market</h2>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button {...retryButtonProps}>{retryLabel}</Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        /* the count line above is already this surface's live region; a second one would
           announce the same fact twice */
        <EmptyState role="none">
          <h2>Nothing here yet</h2>
          <p>No memes match these filters. Be the change — mint one!</p>
          {clearFiltersProps && (
            <EmptyActions>
              <Button {...clearFiltersProps}>Clear filters</Button>
            </EmptyActions>
          )}
        </EmptyState>
      ) : showGrid ? <>
        <div data-slot="market-grid" className={cardGrid} role="list">
          {cards.map((card) => (
            <div key={card.id} className={cardSlot} role="listitem"><MemeCard model={card} /></div>
          ))}
        </div>
        {showMore && (
          <div ref={sentinelRef} data-slot="load-more">
            <EmptyActions>
              {loadMoreError && <Notice tone="error">{loadMoreError}</Notice>}
              <Button className="max-sm:w-full" {...loadMoreProps}>{loadMoreLabel}</Button>
            </EmptyActions>
          </div>
        )}
        {endOfListLabel && <PageState className="pt-8 text-small">{endOfListLabel}</PageState>}
      </> : null}
    </PageContainer>
  )
}
