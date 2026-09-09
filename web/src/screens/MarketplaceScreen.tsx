import { Link } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { MemeCard } from '../atoms/MemeCard'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { SortChips } from '../molecules/SortChips'

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  cards, queryInputProps, typeSelectProps, tierSelectProps, listedInputProps, sortChips,
  createLinkProps, filtersToggleProps, filtersToggleLabel, filtersPanelProps, statusProps,
  resultsLabel, clearFiltersProps, showLoading, showEmpty, showError, showGrid, showMore,
  skeletonCount, errorMessage, retryButtonProps, retryLabel, loadMoreProps, loadMoreLabel,
  loadMoreError, endOfListLabel, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="market-controls">
        <div className="page-head">
          <h2>Marketplace</h2>
          <div className="filter-bar">
            <input type="search" {...queryInputProps} />
            <button type="button" className="market-filters-toggle" {...filtersToggleProps}>
              {filtersToggleLabel}
            </button>
            <Link {...createLinkProps} className="btn primary">＋ Mint a meme</Link>
          </div>
        </div>
        <div className="market-filters" {...filtersPanelProps}>
          <div className="filter-bar">
            <select {...typeSelectProps}>
              <option value="">All media</option><option value="image">Images</option><option value="video">Videos</option>
            </select>
            <select {...tierSelectProps}>
              <option value="">All tiers</option>
              {TIERS.map((tier) => <option key={tier.key} value={tier.key}>{tier.name}</option>)}
            </select>
            <label><input type="checkbox" {...listedInputProps} /> For sale</label>
          </div>
          <SortChips model={sortChips} />
        </div>
        <div className="market-summary" {...statusProps}>
          <span>{resultsLabel}</span>
          {clearFiltersProps && <button type="button" {...clearFiltersProps}>Clear filters</button>}
        </div>
      </div>
      {showLoading ? (
        <div className="card-grid market-grid" aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, slot) => (
            <div key={slot} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : showError ? (
        <div className="empty error" role="alert">
          <p>{errorMessage}</p>
          <div className="empty-actions">
            <button type="button" className="primary" {...retryButtonProps}>{retryLabel}</button>
          </div>
        </div>
      ) : showEmpty ? (
        <div className="empty">No memes match. Be the change — mint one!</div>
      ) : showGrid ? <>
        <div className="card-grid market-grid" role="list">
          {cards.map((card) => (
            <div key={card.id} className="card-slot" role="listitem"><MemeCard model={card} /></div>
          ))}
        </div>
        {showMore && (
          <div className="empty-actions" ref={sentinelRef}>
            {loadMoreError && <p className="notice error" role="alert">{loadMoreError}</p>}
            <button type="button" {...loadMoreProps}>{loadMoreLabel}</button>
          </div>
        )}
        {endOfListLabel && <p className="page-state">{endOfListLabel}</p>}
      </> : null}
    </main>
  )
}
