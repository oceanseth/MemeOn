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
import { MemeCard } from '@/molecules/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Select } from '@/atoms/select'
import { SkeletonCard } from '@/atoms/skeleton'
import { Toggle } from '@/atoms/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { Toolbar, ToolbarStart } from '@/atoms/toolbar'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { binderGridClasses as cardGrid, binderCardSlotClasses as cardSlot } from '../lib/binderChrome'
import { cn } from '../lib/cn'

/* The class strings below are this screen's own layout, one token per `cn` argument: a multi-word
   class string in a `screens/` file is counted as copy by `scripts/check-copy.mjs` (LEDGER L24). */

/**
 * The control plate docks under the topbar while the grid scrolls. It bleeds only into the page
 * container's own gutter (`-mx-5 px-5`). A phone has no vertical budget to pin filters,
 * so ≤720 the whole treatment is absent.
 */
const marketControls = cn(
  'flex flex-col gap-3.5 pt-0 pb-3.5',
  /* it docks under the sticky bar (`--topbar-h`, the same 64 at every width) */
  'lg:docked lg:-mx-5 lg:px-5',
)

/** The search well grows into the toolbar's slack and stops at the reading width. */
const searchWell = 'min-w-0 flex-1 lg:max-w-135'

const marketDisclosures = 'flex w-full gap-3 lg:hidden'
const marketFilters = 'flex flex-col gap-2 max-lg:data-[collapsed=true]:hidden'

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
  cards, queryInputProps, filterTabs, tierSelectProps,
  createLinkProps, filtersToggleProps, filtersToggleLabel, filtersPanelProps, statusProps,
  resultsLabel, clearFiltersProps, showLoading, showEmpty, showError, showGrid, showMore,
  skeletonCount, errorMessage, retryButtonProps, retryLabel, loadMoreProps, loadMoreLabel,
  loadMoreError, endOfListLabel, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={pageTitle} className="mb-3.5" />
      <div data-slot="market-controls" className={marketControls}>
        <Toolbar data-slot="market-toolbar">
          {/* the well's own width lives on the wrapper: `max-w-135` is a `--container-*` name
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
          <Link {...createLinkProps} className={mintLink}>
            <span aria-hidden="true">
              <Icon name="circle-plus" size={16} />
            </span>
            {mintLabel}
          </Link>
        </Toolbar>
        {/* on phones the filter rows collapse behind the disclosure so the grid starts on the first screenful */}
        <div
          data-slot="market-filters"
          className={marketFilters}
          {...filtersPanelProps}
        >
          {/* media, listed, and tier filters — the pressed item is the active filter */}
          <Toolbar>
            <ToolbarStart>
              <ToggleGroup {...filterTabs.mediaGroupProps}>
                {filterTabs.media.map((tab) => (
                  <ToggleGroupItem key={tab.key} value={tab.key}>
                    {tab.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ToolbarStart>
            <Toggle pressed={filterTabs.listed.pressed} onPressedChange={filterTabs.listed.onPressedChange}>
              {filterTabs.listed.label}
            </Toggle>
            <Select items={tierSelectItems} variant="pill" {...tierSelectProps} />
            {clearFiltersProps && !showEmpty && (
              <Button size="xs" {...clearFiltersProps}>{clearFiltersLabel}</Button>
            )}
          </Toolbar>
        </div>
      </div>
      <div data-slot="market-summary" className="sr-only" {...statusProps}>
        {resultsLabel}
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
            <Button variant="primary" {...retryButtonProps}>{retryLabel}</Button>
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
          <div ref={sentinelRef} data-slot="load-more" className="mt-4.5">
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
