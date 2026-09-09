import { Link } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { MemeCard } from '../atoms/MemeCard'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { SortChips } from '../molecules/SortChips'

/** Marketplace list as a function of its engine-provided model. */
export function MarketplaceScreen({
  cards, queryInputProps, typeSelectProps, tierSelectProps, listedInputProps, sortChips,
  createLinkProps, showLoading, showEmpty, showGrid, showMore, sentinelRef,
}: MarketplaceScreenModel) {
  return (
    <main className="container">
      <div className="market-controls">
        <div className="page-head">
          <h2>Marketplace</h2>
          <div className="filter-bar">
            <input type="search" placeholder="Search memes, tags, creators…" {...queryInputProps} />
            <select {...typeSelectProps}>
              <option value="">All media</option><option value="image">Images</option><option value="video">Videos</option>
            </select>
            <select {...tierSelectProps}>
              <option value="">All tiers</option>
              {TIERS.map((tier) => <option key={tier.key} value={tier.key}>{tier.name}</option>)}
            </select>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
              <input type="checkbox" {...listedInputProps} /> For sale
            </label>
            <Link {...createLinkProps}><button className="primary">＋ Create meme</button></Link>
          </div>
        </div>
        <div className="filter-bar" style={{ marginBottom: 4 }}><SortChips model={sortChips} /></div>
      </div>
      {showLoading ? <div className="empty"><span className="spin" /></div> : showEmpty ? (
        <div className="empty">No memes match. Be the change — mint one!</div>
      ) : showGrid ? <>
        <div className="card-grid" style={{ marginTop: 18 }}>{cards.map((card) => <MemeCard key={card.id} model={card} />)}</div>
        {showMore && <div ref={sentinelRef} style={{ textAlign: 'center', padding: 24 }}><span className="spin" /></div>}
      </> : null}
    </main>
  )
}
