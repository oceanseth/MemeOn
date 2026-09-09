import { Link } from 'react-router-dom'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { GiftDialog } from '../molecules/GiftDialog'

/** Friends list as a function of its model. Every engine state is one set of args. */
export function FriendsScreen({
  hits,
  msg,
  err,
  inviteLabel,
  onlineFriends,
  incoming,
  outgoing,
  accepted,
  showMsg,
  showErr,
  showOnline,
  showSearchPanel,
  showSearching,
  showHits,
  showNoHits,
  showIncoming,
  showOutgoing,
  showLoading,
  showError,
  showEmpty,
  showCircle,
  showCircleHint,
  searchingLabel,
  noHitsMessage,
  loadingLabel,
  errorTitle,
  errorMessage,
  retryLabel,
  retryButtonProps,
  emptyTitle,
  emptyMessage,
  emptyActionProps,
  circleHintMessage,
  searchInputProps,
  inviteButtonProps,
  giftDialog,
  removeDialog,
}: FriendsScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="page-head">
        <h2>Friends</h2>
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Find people by name…"
            {...searchInputProps}
          />
          <button className="primary" {...inviteButtonProps}>
            {inviteLabel}
          </button>
        </div>
      </div>

      <div role="status">{showMsg && <p className="notice ok">{msg}</p>}</div>
      <div role="alert">{showErr && <p className="notice error">{err}</p>}</div>

      {showOnline ? (
        <div className="panel online-strip friends-panel">
          <span className="online-dot" aria-hidden="true" /> Online now
          <div className="online-avatars">
            {onlineFriends.map((f) => (
              <Link key={f.sub} {...f.onlineLinkProps} className="online-friend">
                {f.onlineAvatarImageProps ? (
                  <img className="avatar" {...f.onlineAvatarImageProps} />
                ) : (
                  <span className="avatar avatar-fallback" aria-hidden="true">
                    {f.avatarInitial}
                  </span>
                )}
                <span>{f.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {showSearchPanel && (
        <div className="panel friends-panel">
          <h3>Search results</h3>
          <div role="status">
            {showSearching && <p className="muted">{searchingLabel}</p>}
            {showNoHits && <p className="muted">{noHitsMessage}</p>}
          </div>
          {showHits && (
            <div className="row-list">
              {hits.map((u) => (
                <div className="person-row" key={u.sub}>
                  <Link {...u.profileLinkProps} className="person-link">
                    {u.avatarImageProps ? (
                      <img className="avatar" {...u.avatarImageProps} />
                    ) : (
                      <span className="avatar avatar-fallback" aria-hidden="true">
                        {u.avatarInitial}
                      </span>
                    )}
                    <span className="person-name">{u.name}</span>
                  </Link>
                  <span className="spacer" />
                  <button className="primary" {...u.requestButtonProps}>
                    Add friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showIncoming && (
        <>
          <h3>Requests for you</h3>
          <div className="row-list friends-section">
            {incoming.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps ? (
                    <img className="avatar" {...f.avatarImageProps} />
                  ) : (
                    <span className="avatar avatar-fallback" aria-hidden="true">
                      {f.avatarInitial}
                    </span>
                  )}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" {...f.acceptButtonProps}>
                  Accept
                </button>
                <button className="danger" {...f.declineButtonProps}>
                  Decline
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showOutgoing && (
        <>
          <h3>Requests you sent</h3>
          <div className="row-list friends-section">
            {outgoing.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps ? (
                    <img className="avatar" {...f.avatarImageProps} />
                  ) : (
                    <span className="avatar avatar-fallback" aria-hidden="true">
                      {f.avatarInitial}
                    </span>
                  )}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="badge">{f.pendingLabel}</span>
                <span className="spacer" />
                <button {...f.cancelButtonProps}>Cancel</button>
              </div>
            ))}
          </div>
        </>
      )}

      {showLoading ? (
        <div className="loading-state" role="status">
          <span className="spin" aria-hidden="true" />
          {loadingLabel}
        </div>
      ) : showError ? (
        <div className="empty error" role="alert">
          <h3>{errorTitle}</h3>
          <p>{errorMessage}</p>
          <div className="empty-actions">
            <button className="primary" {...retryButtonProps}>
              {retryLabel}
            </button>
          </div>
        </div>
      ) : showEmpty ? (
        <div className="empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
          <div className="empty-actions">
            <button className="primary" {...emptyActionProps}>
              {inviteLabel}
            </button>
          </div>
        </div>
      ) : showCircleHint ? (
        <p className="muted">{circleHintMessage}</p>
      ) : showCircle ? (
        <>
          <h3>Your circle</h3>
          <div className="row-list">
            {accepted.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps ? (
                    <img className="avatar" {...f.avatarImageProps} />
                  ) : (
                    <span className="avatar avatar-fallback" aria-hidden="true">
                      {f.avatarInitial}
                    </span>
                  )}
                  <div>
                    <div className="person-name">
                      {f.name}
                      {f.isOnline && (
                        <>
                          <span className="online-dot" aria-hidden="true" />
                          <span className="sr-only">{f.onlineLabel}</span>
                        </>
                      )}
                    </div>
                    <div className="person-stats">{f.statsLabel}</div>
                  </div>
                </Link>
                <span className="spacer" />
                <button className="primary" {...f.giftButtonProps}>
                  <span aria-hidden="true">🎁</span> {f.giftLabel}
                </button>
                <button className="danger-text" {...f.removeButtonProps}>
                  {f.removeLabel}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <GiftDialog model={giftDialog} />
      <ConfirmDialog model={removeDialog} />
    </main>
  )
}
