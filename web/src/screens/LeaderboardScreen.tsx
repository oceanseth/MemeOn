import { Link } from 'react-router-dom'
import type { LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'

const skeletonRows = [0, 1, 2, 3, 4]

/** Top Brains as a function of its model. Every engine state is one set of args. */
export function LeaderboardScreen({
  subtitle,
  columnHeaders,
  leaders,
  showLoading,
  loadingMessage,
  showEmpty,
  emptyMessage,
  showError,
  errorMessage,
  retryLabel,
  retry,
  showList,
  listSummary,
  youLabel,
}: LeaderboardScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="page-head">
        <div>
          <h2>
            🏆 Top Brains{' '}
            <img className="braincell-img" src="/api/brand/braincell.png" alt="" width={26} height={26} />
          </h2>
          <span className="muted page-subtitle">{subtitle}</span>
        </div>
      </div>

      {/* one small live region for every phase: the list itself never gets read back wholesale */}
      <div role="status" aria-live="polite" aria-busy={showLoading}>
        {showLoading ? (
          <>
            <span className="sr-only">{loadingMessage}</span>
            <div className="row-list" aria-hidden="true">
              {skeletonRows.map((row) => (
                <div key={row} className="skeleton skeleton-row" />
              ))}
            </div>
          </>
        ) : null}
        {showEmpty ? <div className="empty">{emptyMessage}</div> : null}
        {showList ? <span className="sr-only">{listSummary}</span> : null}
      </div>

      {showError ? (
        <div className="empty error" role="alert">
          <p>{errorMessage}</p>
          <div className="empty-actions">
            <button type="button" onClick={retry}>
              {retryLabel}
            </button>
          </div>
        </div>
      ) : null}

      {showList ? (
        <>
          <div className="row-head" aria-hidden="true">
            <span>{columnHeaders.player}</span>
            <span>{columnHeaders.braincells}</span>
          </div>
          <ol className="row-list">
            {leaders.map((l) => (
              <li key={l.sub}>
                <Link
                  {...l.profileLinkProps}
                  aria-label={l.linkLabel}
                  className={l.isMe ? 'person-row leader-row is-me' : 'person-row leader-row'}
                >
                  <span className="leader-rank">{l.rankNumeral}</span>
                  <span className="leader-medal" aria-hidden="true">{l.medalLabel}</span>
                  {l.avatarImageProps ? (
                    <img className="avatar" {...l.avatarImageProps} />
                  ) : (
                    <span className="avatar avatar-fallback" aria-hidden="true">{l.avatarInitial}</span>
                  )}
                  <div className="person-identity">
                    <div className="person-name">{l.name}</div>
                    <div className="person-stats">
                      <span>{l.collectionLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{l.portfolioLabel}</span>
                    </div>
                  </div>
                  {l.isMe ? <span className="badge state">{youLabel}</span> : null}
                  <span className="leader-cells">{l.braincellsLabel}</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </main>
  )
}
