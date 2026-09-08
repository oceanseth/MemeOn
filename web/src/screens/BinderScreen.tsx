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
  showPrivate,
  sortKey,
  sortDir,
  visible,
  showLoading,
  showEmpty,
  emptyMessage,
  showGrid,
  onShowPrivateChange,
  onSortChange,
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
                checked={showPrivate}
                onChange={(e) => onShowPrivateChange(e.target.checked)}
              />
              Show private ({privateCount})
            </label>
          )}
          <Link to="/binder/new">
            <button className="primary">＋ Create meme</button>
          </Link>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <SortChips
          sortKey={sortKey}
          dir={sortDir}
          onChange={onSortChange}
        />
      </div>

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showEmpty ? (
        <div className="empty">{emptyMessage}</div>
      ) : showGrid ? (
        <div className="card-grid">
          {visible.map((m) => (
            <MemeCard
              key={m.id}
              meme={m}
              footer={
                <span className="meme-sub">
                  <span>
                    {m.myShares ?? 0}/100 shares{m.isCreator ? ' · creator' : ''}
                  </span>
                  {m.private && <span className="badge">🙈 private</span>}
                </span>
              }
            />
          ))}
        </div>
      ) : null}
    </main>
  )
}
