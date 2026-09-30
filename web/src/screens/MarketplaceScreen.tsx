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
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupKbd } from '@/atoms/input-group'
import { MasonryGrid, MasonrySkeletonGrid } from '@/organisms/masonry-grid'
import { MemeCard } from '@/molecules/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Select } from '@/atoms/select'
import { Toggle } from '@/atoms/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { Toolbar } from '@/atoms/toolbar'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { cn } from '../lib/cn'

/* The class strings below are this screen's own layout, one token per `cn` argument: a multi-word
   class string in a `screens/` file is counted as copy by `scripts/check-copy.mjs` (LEDGER L24). */

/**
 * The control plate docks under the topbar while the grid scrolls. It bleeds only into the page
 * container's own gutter (`-mx-5 px-5`). A phone has no vertical budget to pin filters,
 * so ≤720 the whole treatment is absent.
 * The gap to the grid is split: 8px of glass under the chips (`pb-2`) and 10px of unpainted
 * margin (`mb-2.5`), so a first-row card's hover lift (4px up, 1% larger: about 7px at the
 * widest track) rises into clear page rather than under the plate's glass.
 */
const marketControls = cn(
  'flex flex-col gap-3.5 pt-0 pb-2 mb-2.5',
  /* it docks under the sticky bar (`--topbar-h`, the same 64 at every width) */
  'lg:docked lg:-mx-5 lg:px-5',
)

/** One row on the desktop plate: search, then the filters, then Mint — never wrapping. */
const marketToolbar = 'lg:flex-nowrap'

/** The search well stops short so the filters share its row. */
const searchWell = 'min-w-0 flex-1 lg:max-w-95'

const marketDisclosures = 'flex w-full gap-3 lg:hidden'

/** Phone: a full-width panel behind the disclosure pill. Desktop: the row's middle lane, its
 *  controls kept whole (`*:shrink-0`) and scrolling sideways when they outgrow it; the
 *  padding/negative-margin pair keeps the focus ring clear of the scroll clip. */
const marketFilters = cn(
  'flex w-full flex-wrap items-center gap-2.5',
  'max-lg:data-[collapsed=true]:hidden',
  'lg:-my-1.5 lg:w-auto lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:overflow-x-auto lg:py-1.5 lg:*:shrink-0',
)

/** Header already owns Mint from the shell cut; the page CTA is desktop-only. */
const mintLink = cn(buttonVariants({ variant: 'mint' }), 'max-lg:hidden lg:w-51.5')

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  pageTitle,
  mintLabel,
  allMemesPill,
  allMemesPillA11y,
  tierSelectItems,
  clearFiltersLabel,
  emptyHeading,
  emptyBody,
  errorHeading,
  cards,
  queryInputProps,
  searchHotkey,
  filterTabs,
  tierSelectProps,
  createLinkProps,
  filtersToggleProps,
  filtersToggleLabel,
  filtersPanelProps,
  statusProps,
  resultsLabel,
  clearFiltersProps,
  showLoading,
  showEmpty,
  showError,
  showGrid,
  showMore,
  errorMessage,
  retryButtonProps,
  retryLabel,
  loadMoreProps,
  loadMoreLabel,
  loadMoreError,
  endOfListLabel,
  sentinelRef,
  masonry,
}: MarketplaceScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={pageTitle} className="mb-3.5" />
      <div data-slot="market-controls" className={marketControls}>
        <Toolbar data-slot="market-toolbar" className={marketToolbar}>
          {/* the well's own width lives on the wrapper: `max-w-95` is layout, the toolbar's
              business; the ref is the ⌘K hotkey's handle on this page's search */}
          <div className={searchWell} ref={searchHotkey.slotRef}>
            <InputGroup>
              <InputGroupAddon>
                <Icon name="magnifying-glass" size={20} />
              </InputGroupAddon>
              <InputGroupInput type="search" {...queryInputProps} />
              {/* decoration for fine pointers; the input's aria-keyshortcuts speaks for it */}
              <InputGroupAddon
                align="inline-end"
                aria-hidden="true"
                className="pointer-coarse:hidden"
              >
                <InputGroupKbd>{searchHotkey.label}</InputGroupKbd>
              </InputGroupAddon>
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
                ? {
                    onClick: clearFiltersProps.onClick,
                    'aria-label': allMemesPillA11y,
                  }
                : {})}
            >
              {allMemesPill}
            </Button>
            <Button className="flex-1" data-slot="market-filters-toggle" {...filtersToggleProps}>
              {filtersToggleLabel}
            </Button>
          </div>
          {/* media, listed, and tier filters — the pressed item is the active filter. On phones
              they collapse behind the disclosure so the grid starts on the first screenful; on
              the desktop they share the search row and scroll sideways when they outgrow it. */}
          <div data-slot="market-filters" className={marketFilters} {...filtersPanelProps}>
            <ToggleGroup {...filterTabs.mediaGroupProps}>
              {filterTabs.media.map((tab) => (
                <ToggleGroupItem key={tab.key} value={tab.key}>
                  {tab.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Toggle
              pressed={filterTabs.listed.pressed}
              onPressedChange={filterTabs.listed.onPressedChange}
            >
              {filterTabs.listed.label}
            </Toggle>
            <Select items={tierSelectItems} variant="pill" {...tierSelectProps} />
            {clearFiltersProps && !showEmpty && (
              <Button size="xs" {...clearFiltersProps}>
                {clearFiltersLabel}
              </Button>
            )}
          </div>
          <Link {...createLinkProps} className={mintLink}>
            <span aria-hidden="true">
              <Icon name="circle-plus" size={16} />
            </span>
            {mintLabel}
          </Link>
        </Toolbar>
      </div>
      <div data-slot="market-summary" className="sr-only" {...statusProps}>
        {resultsLabel}
      </div>
      {showLoading ? (
        <MasonrySkeletonGrid model={masonry} />
      ) : showError ? (
        <Empty variant="error">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{errorHeading}</EmptyTitle>
            <EmptyDescription>{errorMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
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
      ) : showGrid ? (
        <>
          <MasonryGrid
            data-slot="market-grid"
            model={masonry}
            items={cards.map((card) => ({ node: <MemeCard model={card} /> }))}
          />
          {showMore && (
            <div ref={sentinelRef} data-slot="load-more" className="mt-4.5">
              <EmptyContent>
                {loadMoreError && <Alert variant="error">{loadMoreError}</Alert>}
                <Button className="max-sm:w-full" {...loadMoreProps}>
                  {loadMoreLabel}
                </Button>
              </EmptyContent>
            </div>
          )}
          {endOfListLabel && <PageState size="compact">{endOfListLabel}</PageState>}
        </>
      ) : null}
    </PageContainer>
  )
}
