import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { SortChips } from '../molecules/SortChips'

/** Skeleton tiles hold the grid geometry while the binder loads, so nothing jumps on arrival. */
const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

/** Own binder as a function of its model. Every engine state is one set of args. */
export function BinderScreen({
  statusProps,
  statusMessage,
  showPrivateToggle,
  privateCount,
  privateToggleProps,
  sortChips,
  createLinkProps,
  cards,
  showLoading,
  showEmpty,
  emptyMessage,
  emptyAction,
  showError,
  errorTitle,
  errorMessage,
  retryProps,
  showGrid,
}: BinderScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="page-head">
        <h2>My Binder</h2>
        <div className="filter-bar">
          {/* mounted in every state, text swapped: a live region inserted with its content is missed */}
          <span className="binder-collection-label" {...statusProps}>
            {statusMessage}
          </span>
          <Link className="btn primary" {...createLinkProps}>
            ＋ Create meme
          </Link>
        </div>
      </div>

      <div
        className="filter-bar binder-controls"
        role="group"
        aria-label="Sort and filter your binder"
      >
        <SortChips model={sortChips} />
        {showPrivateToggle && (
          <label className="checkbox-label">
            <input type="checkbox" {...privateToggleProps} />
            Show private ({privateCount})
          </label>
        )}
      </div>

      {showLoading ? (
        <ul className="card-grid" aria-hidden="true">
          {SKELETON_KEYS.map((key) => (
            <li key={key} className="skeleton skeleton-card" />
          ))}
        </ul>
      ) : showError ? (
        <div className="empty error" role="alert">
          <p>
            <strong>{errorTitle}</strong>
          </p>
          <p>{errorMessage}</p>
          <div className="empty-actions">
            <button className="primary" {...retryProps}>
              Try again
            </button>
          </div>
        </div>
      ) : showEmpty ? (
        <div className="empty">
          <p>{emptyMessage}</p>
          {emptyAction && (
            <div className="empty-actions">
              {emptyAction.kind === 'create' ? (
                <Link className="btn primary" {...emptyAction.linkProps}>
                  {emptyAction.label}
                </Link>
              ) : (
                <button className="primary" onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      ) : showGrid ? (
        <ul className="card-grid">
          {cards.map((card) => (
            <li key={card.id} className="card-slot" aria-label={card.ariaLabel}>
              <MemeCard
                model={card.memeCard}
                footer={
                  <>
                    <span className="meme-sub">
                      <span className="binder-owned">{card.sharesLabel}</span>
                      <span className="binder-owned-tags">
                        {card.showCreator && <span>you minted this</span>}
                        {card.showPrivate && (
                          <span className="badge">🙈 private</span>
                        )}
                      </span>
                    </span>
                    <span className="binder-owned-bar" aria-hidden="true">
                      <i style={{ width: `${card.sharesPct}%` }} />
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
