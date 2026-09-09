import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { SortChips } from '../molecules/SortChips'

/** Own binder as a function of its model. Every engine state is one set of args. */
export function BinderScreen({
  collectionLabel,
  showCollection,
  showPrivateToggle,
  privateCount,
  privateToggleProps,
  sortChips,
  createLinkProps,
  cards,
  showLoading,
  showEmpty,
  emptyMessage,
  showGrid,
}: BinderScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2>My Binder</h2>
        <div className="filter-bar">
          {showCollection && (
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {collectionLabel}
            </span>
          )}
          {showPrivateToggle && (
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
              <input
                type="checkbox"
                {...privateToggleProps}
              />
              Show private ({privateCount})
            </label>
          )}
          <Link {...createLinkProps}>
            <button className="primary">＋ Create meme</button>
          </Link>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <SortChips model={sortChips} />
      </div>

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showEmpty ? (
        <div className="empty">{emptyMessage}</div>
      ) : showGrid ? (
        <div className="card-grid">
          {cards.map((card) => (
            <MemeCard
              key={card.id}
              model={card.memeCard}
              footer={
                <span className="meme-sub">
                  <span>
                    {card.sharesLabel}{card.showCreator ? ' · creator' : ''}
                  </span>
                  {card.showPrivate && <span className="badge">🙈 private</span>}
                </span>
              }
            />
          ))}
        </div>
      ) : null}
    </main>
  )
}
