import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  PageState,
} from '@/atoms/empty'
import { Icon } from '@/atoms/icon'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/atoms/input-group'
import { MemeCard } from '@/atoms/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Select } from '@/atoms/select'
import { SkeletonCard } from '@/atoms/skeleton'
import { Toolbar, ToolbarStart } from '@/atoms/toolbar'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { cn } from '../lib/cn'
import { SortChips } from '@/molecules/sort-chips'

/* The class strings below are this screen's own layout, one token per `cn` argument: a multi-word
   class string in a `screens/` file is counted as copy by `scripts/check-copy.mjs` (LEDGER L24). */

/**
 * The control plate docks under the topbar while the grid scrolls. It bleeds only into the page
 * container's own gutter (`-mx-page-x px-page-x`). A phone has no vertical budget to pin filters,
 * so ≤720 the whole treatment is absent.
 */
const marketControls = cn(
  'flex', 'flex-col', 'gap-3.5', 'pt-0', 'pb-3.5',
  /* it docks under the phone header (`--topbar-h`); at the shell breakpoint that height is 0, so
     the plate takes the sidebar's own `page-x` inset instead of the viewport edge */
  'lg:docked', 'lg:-mx-page-x', 'lg:px-page-x',
  'xl:top-5',
)

/** The search well grows into the toolbar's slack and stops at the reading width. */
const searchWell = cn('min-w-0', 'flex-1', 'lg:max-w-search')

/** The pre-ox/ui grid: 4-up ~262 at the 1108 column (`minmax(230px, 1fr)`), 2-up 166 on the phone. */
const cardGrid = cn(
  'm-0', 'grid', 'list-none', 'items-start', 'gap-5', 'p-0',
  'grid-cols-[repeat(auto-fill,minmax(230px,1fr))]',
  'max-sm:grid-cols-2', 'max-sm:gap-gutter',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it
 * would clip the foil bloom, which the padding / negative-margin pair contains without moving the
 * grid track.
 */
const cardSlot = cn(
  'skip-render',
  'pointer-events-none', 'p-bloom', '-m-bloom', '*:pointer-events-auto',
  'max-sm:p-page-x', 'max-sm:-m-page-x',
)

/** Results / Count: the section heading left, the live count right, on one baseline. */
const resultsRow = cn(
  'mt-1', 'mb-gutter', 'flex', 'flex-wrap', 'items-baseline', 'justify-between', 'gap-x-4', 'gap-y-2',
)
/* the grid's own heading: 28px, one step down on the phone so the live count keeps its line.
   `Heading` has no `text-3xl max-md:text-2xl` size yet (SC2/requests.md), so the plain `<h2>`
   still spells it — no atom is being restyled here. */
const sectionHeadingClasses = cn(
  'm-0', 'font-display', 'text-3xl', 'font-normal', 'text-foreground', 'max-md:text-2xl',
)
const summaryRow = cn(
  'flex', 'flex-wrap', 'items-center', 'gap-2.5', 'text-sm', 'text-muted-foreground',
)

const marketDisclosures = cn('flex', 'w-full', 'gap-3', 'lg:hidden')
const marketFilters = cn('flex', 'flex-col', 'gap-3', 'max-lg:data-[collapsed=true]:hidden')

/** Toolbar Mint: bubblegum under the shell cut, neutral once the sidebar owns primary (`mint`). */
const mintLink = cn(buttonVariants({ variant: 'mint' }), 'w-full', 'lg:w-51.5')

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  pageTitle,
  intro,
  sectionHeading: sectionTitle,
  mintLabel,
  allMemesPill,
  allMemesPillA11y,
  tierSelectItems,
  clearFiltersLabel,
  emptyHeading,
  emptyBody,
  errorHeading,
  cards, queryInputProps, filterTabs, tierSelectProps, sortChips,
  createLinkProps, filtersToggleProps, filtersToggleLabel, filtersPanelProps, statusProps,
  resultsLabel, clearFiltersProps, showLoading, showEmpty, showError, showGrid, showMore,
  skeletonCount, errorMessage, retryButtonProps, retryLabel, loadMoreProps, loadMoreLabel,
  loadMoreError, endOfListLabel, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={pageTitle} subtitle={intro} className="mb-3.5" />
      <div data-slot="market-controls" className={marketControls}>
        <Toolbar data-slot="market-toolbar">
          {/* the well's own width lives on the wrapper: `max-w-search` is a `--container-*` name
              the lint's grammar does not read, and widths are the toolbar's business anyway */}
          <div className={searchWell}>
            <InputGroup>
              <InputGroupAddon>
                <Icon name="magnifying-glass" size={20} />
              </InputGroupAddon>
              <InputGroupInput type="search" {...queryInputProps} />
            </InputGroup>
          </div>
          {/* the phone's two disclosure pills: "you are here" on the left, the panel toggle right.
              While the panel is open this pill and the media row's own "All memes" tab are both on
              screen, so the one that actually does something says so in its name. */}
          <div data-slot="market-disclosures" className={marketDisclosures}>
            <Button
              className="flex-1"
              pressed={!clearFiltersProps}
              {...(clearFiltersProps
                ? { onClick: clearFiltersProps.onClick, 'aria-label': allMemesPillA11y }
                : {})}
            >
              {allMemesPill}
            </Button>
            <Button className="flex-1" data-slot="market-filters-toggle" {...filtersToggleProps}>
              {filtersToggleLabel}
            </Button>
          </div>
          <Link {...createLinkProps} className={mintLink}>{mintLabel}</Link>
        </Toolbar>
        {/* on phones the filter rows collapse behind the disclosure so the grid starts on the first screenful */}
        <div
          data-slot="market-filters"
          className={marketFilters}
          {...filtersPanelProps}
        >
          {/* media, listed, and tier filters — pressed tab for the active filter */}
          <Toolbar>
            <ToolbarStart {...filterTabs.mediaGroupProps}>
              {filterTabs.media.map((tab) => (
                <Button key={tab.key} {...tab.buttonProps}>{tab.label}</Button>
              ))}
            </ToolbarStart>
            <Button {...filterTabs.listed.buttonProps}>{filterTabs.listed.label}</Button>
            <Select items={tierSelectItems} variant="pill" {...tierSelectProps} />
          </Toolbar>
          <SortChips model={sortChips} />
        </div>
      </div>
      <div className={resultsRow}>
        <h2 className={sectionHeadingClasses}>{sectionTitle}</h2>
        {/* one status line: the count doubles as the live region, and the state card owns the error copy */}
        <div data-slot="market-summary" className={summaryRow} {...statusProps}>
          <span>{resultsLabel}</span>
          {clearFiltersProps && !showEmpty && (
            <Button size="xs" {...clearFiltersProps}>{clearFiltersLabel}</Button>
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
        <Empty variant="error">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{errorHeading}</EmptyTitle>
            <EmptyDescription>{errorMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button {...retryButtonProps}>{retryLabel}</Button>
          </EmptyContent>
        </Empty>
      ) : showEmpty ? (
        /* the count line above is already this surface's live region; a second one would
           announce the same fact twice */
        <Empty role="none">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{emptyHeading}</EmptyTitle>
            <EmptyDescription>{emptyBody}</EmptyDescription>
          </EmptyHeader>
          {clearFiltersProps && (
            <EmptyContent>
              <Button {...clearFiltersProps}>{clearFiltersLabel}</Button>
            </EmptyContent>
          )}
        </Empty>
      ) : showGrid ? <>
        <div data-slot="market-grid" className={cardGrid} role="list">
          {cards.map((card) => (
            <div key={card.id} className={cardSlot} role="listitem"><MemeCard model={card} /></div>
          ))}
        </div>
        {showMore && (
          <div ref={sentinelRef} data-slot="load-more" className="mt-gutter">
            <EmptyContent>
              {loadMoreError && <Alert variant="error">{loadMoreError}</Alert>}
              <Button className="max-sm:w-full" {...loadMoreProps}>{loadMoreLabel}</Button>
            </EmptyContent>
          </div>
        )}
        {endOfListLabel && <PageState size="compact">{endOfListLabel}</PageState>}
      </> : null}
    </PageContainer>
  )
}
