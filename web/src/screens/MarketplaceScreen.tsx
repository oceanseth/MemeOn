import { Link } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { EmptyActions, EmptyState, PageState } from '../atoms/EmptyState'
import { Icon } from '../atoms/Icon'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Select } from '../atoms/Select'
import { SkeletonCard } from '../atoms/Skeleton'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import {
  cardGrid, cardSlot, chipButton, endOfList, filterRow, marketControls, marketDisclosures,
  marketFilters, marketToolbar, mintLink, resultsRow, searchGlyph, searchInput, searchWell,
  sectionHeading, summaryRow, tierPill,
} from '../lib/marketplaceScreenLayout'
import { SortChips } from '../molecules/SortChips'

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
        <div data-slot="market-toolbar" className={marketToolbar}>
          <span className={searchWell}>
            <Icon name="magnifying-glass" size={20} className={searchGlyph} />
            <Input type="search" className={searchInput} {...queryInputProps} />
          </span>
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
        </div>
        {/* on phones the filter rows collapse behind the disclosure so the grid starts on the first screenful */}
        <div
          data-slot="market-filters"
          className={marketFilters}
          {...filtersPanelProps}
        >
          {/* media, listed, and tier filters — pressed tab for the active filter */}
          <FilterBar className="gap-3">
            <div {...filterTabs.mediaGroupProps} className={filterRow}>
              {filterTabs.media.map((tab) => (
                <Button key={tab.key} {...tab.buttonProps}>{tab.label}</Button>
              ))}
            </div>
            <Button {...filterTabs.listed.buttonProps}>{filterTabs.listed.label}</Button>
            <Select items={tierSelectItems} className={tierPill} {...tierSelectProps} />
          </FilterBar>
          <SortChips model={sortChips} />
        </div>
      </div>
      <div className={resultsRow}>
        <h2 className={sectionHeading}>{sectionTitle}</h2>
        {/* one status line: the count doubles as the live region, and the state card owns the error copy */}
        <div data-slot="market-summary" className={summaryRow} {...statusProps}>
          <span>{resultsLabel}</span>
          {clearFiltersProps && !showEmpty && (
            <Button className={chipButton} {...clearFiltersProps}>{clearFiltersLabel}</Button>
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
          <h2>{errorHeading}</h2>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button {...retryButtonProps}>{retryLabel}</Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        /* the count line above is already this surface's live region; a second one would
           announce the same fact twice */
        <EmptyState role="none">
          <h2>{emptyHeading}</h2>
          <p>{emptyBody}</p>
          {clearFiltersProps && (
            <EmptyActions>
              <Button {...clearFiltersProps}>{clearFiltersLabel}</Button>
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
        {endOfListLabel && <PageState className={endOfList}>{endOfListLabel}</PageState>}
      </> : null}
    </PageContainer>
  )
}
