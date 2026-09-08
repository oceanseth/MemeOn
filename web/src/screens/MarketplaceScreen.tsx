import { Link } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { MemeCard } from '../atoms/MemeCard'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { SortChips, sortMemes } from '../molecules/SortChips'

/** Marketplace list as a function of its model. Every engine state is one set of args. */
export function MarketplaceScreen({
  memes,
  q,
  type,
  tier,
  listed,
  sortKey,
  sortDir,
  showLoading,
  showEmpty,
  showGrid,
  showMore,
  sentinelRef,
  onQueryChange,
  onTypeChange,
  onTierChange,
  onListedChange,
  onSortChange,
}: MarketplaceScreenModel) {
  return (
    <main className="container">
      <div className="market-controls">
        <div className="page-head">
          <h2>Marketplace</h2>
          <div className="filter-bar">
            <input
              type="search"
              placeholder="Search memes, tags, creators…"
              value={q}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            <select value={type} onChange={(e) => onTypeChange(e.target.value)}>
              <option value="">All media</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <select value={tier} onChange={(e) => onTierChange(e.target.value)}>
              <option value="">All tiers</option>
              {TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={listed}
                onChange={(e) => onListedChange(e.target.checked)}
              />
              For sale
            </label>
            <Link to="/binder/new">
              <button className="primary">＋ Create meme</button>
            </Link>
          </div>
        </div>

        <div className="filter-bar" style={{ marginBottom: 4 }}>
          <SortChips sortKey={sortKey} dir={sortDir} onChange={onSortChange} />
        </div>
      </div>

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showEmpty ? (
        <div className="empty">No memes match. Be the change — mint one!</div>
      ) : showGrid ? (
        <>
          <div className="card-grid" style={{ marginTop: 18 }}>
            {sortMemes(memes, sortKey, sortDir).map((m) => (
              <MemeCard key={m.id} meme={m} />
            ))}
          </div>
          {showMore && (
            <div ref={sentinelRef} style={{ textAlign: 'center', padding: 24 }}>
              <span className="spin" />
            </div>
          )}
        </>
      ) : null}
    </main>
  )
}
