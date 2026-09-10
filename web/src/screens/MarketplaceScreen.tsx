import { Link } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { Button, buttonClasses } from '../atoms/Button'
import { Checkbox } from '../atoms/Checkbox'
import { EmptyActions, EmptyState, PageState } from '../atoms/EmptyState'
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

const MEDIA_ITEMS: readonly SelectOption[] = [
  { value: '', label: 'All media' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
]

const TIER_ITEMS: readonly SelectOption[] = [
  { value: '', label: 'All tiers' },
  ...TIERS.map((tier) => ({ value: tier.key, label: tier.name })),
]

/**
 * `.market-controls`: a full-bleed plate that docks under the topbar while the grid scrolls. A
 * phone has no vertical budget to pin filters, so ≤720 the whole treatment is simply absent.
 */
const marketControls = cn(
  'border-b border-border pt-0 pb-2.5',
  'lg:sticky lg:top-(--topbar-h) lg:z-(--z-sticky)',
  'lg:bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] lg:backdrop-blur-[10px]',
  'lg:[margin-inline:calc(50%-50vw)]',
  'lg:[padding-inline:calc(max(0px,50vw-var(--container-page)/2)+20px)]',
)

/** `.card-grid` + the ≤560 two-up rule, list reset included. */
const cardGrid = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 p-0 max-sm:grid-cols-2 max-sm:gap-3'

/**
 * `.card-slot`: skip-rendering box around a card. `content-visibility` must not sit on the card
 * itself — it would clip the blurred glow bloom, which the padding/negative margin pair contains
 * without moving the grid track.
 */
const cardSlot = cn(
  '[content-visibility:auto] [contain-intrinsic-size:auto_340px]',
  'pointer-events-none p-[30px] [margin:-30px] [&>*]:pointer-events-auto',
  'max-sm:p-5 max-sm:[margin:-20px]',
)

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  cards, queryInputProps, typeSelectProps, tierSelectProps, listedInputProps, sortChips,
  createLinkProps, filtersToggleProps, filtersToggleLabel, filtersPanelProps, statusProps,
  resultsLabel, clearFiltersProps, showLoading, showEmpty, showError, showGrid, showMore,
  skeletonCount, errorMessage, retryButtonProps, retryLabel, loadMoreProps, loadMoreLabel,
  loadMoreError, endOfListLabel, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <div data-slot="market-controls" className={marketControls}>
        <PageHead title="Marketplace" className="mt-[14px] mb-2.5 [&_:where(h1,h2)]:font-bold">
          <FilterBar>
            <Input
              type="search"
              className="max-w-[420px] min-w-[220px] flex-[1_1_220px]"
              {...queryInputProps}
            />
            <Button
              className="hidden max-lg:inline-flex"
              data-slot="market-filters-toggle"
              {...filtersToggleProps}
            >
              {filtersToggleLabel}
            </Button>
            <Link {...createLinkProps} className={buttonClasses('primary')}>＋ Mint a meme</Link>
          </FilterBar>
        </PageHead>
        {/* on phones the filter rows collapse behind a disclosure so the grid starts on the first screenful */}
        <div
          data-slot="market-filters"
          className="flex flex-col gap-2.5 max-lg:data-[collapsed=true]:hidden"
          {...filtersPanelProps}
        >
          <FilterBar>
            <Select items={MEDIA_ITEMS} {...typeSelectProps} />
            <Select items={TIER_ITEMS} {...tierSelectProps} />
            <Checkbox label="For sale" {...listedInputProps} />
          </FilterBar>
          <SortChips model={sortChips} />
        </div>
        {/* one status line under the chips: count, active filters, clear. Also the surface's live region. */}
        <div
          data-slot="market-summary"
          className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-text-dim"
          {...statusProps}
        >
          <span>{resultsLabel}</span>
          {clearFiltersProps && (
            <Button className="rounded-pill px-2.5 py-1 text-xs" {...clearFiltersProps}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
      {showLoading ? (
        <div className={cn(cardGrid, 'mt-[18px]')} aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, slot) => (
            <SkeletonCard key={slot} />
          ))}
        </div>
      ) : showError ? (
        <EmptyState error>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...retryButtonProps}>{retryLabel}</Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        <EmptyState role="none">No memes match. Be the change — mint one!</EmptyState>
      ) : showGrid ? <>
        <div data-slot="market-grid" className={cn(cardGrid, 'mt-[18px]')} role="list">
          {cards.map((card) => (
            <div key={card.id} className={cardSlot} role="listitem"><MemeCard model={card} /></div>
          ))}
        </div>
        {showMore && (
          <div ref={sentinelRef} data-slot="load-more">
            <EmptyActions>
              {loadMoreError && <Notice tone="error">{loadMoreError}</Notice>}
              <Button {...loadMoreProps}>{loadMoreLabel}</Button>
            </EmptyActions>
          </div>
        )}
        {endOfListLabel && <PageState>{endOfListLabel}</PageState>}
      </> : null}
    </PageContainer>
  )
}
