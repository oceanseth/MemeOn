import { Link } from 'react-router-dom'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { GiftDialog } from '../molecules/GiftDialog'

/** Friends list as a function of its model. Every engine state is one set of args. */
export function FriendsScreen({
  hits,
  msg,
  inviteLabel,
  onlineFriends,
  incoming,
  outgoing,
  accepted,
  showMsg,
  showOnline,
  showHits,
  showIncoming,
  showLoading,
  showEmpty,
  showCircle,
  emptyMessage,
  searchInputProps,
  inviteButtonProps,
  giftDialog,
}: FriendsScreenModel) {
  return (
    <main className="container">
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

      {showMsg && <p className="notice ok">{msg}</p>}

      {showOnline ? (
        <div className="panel online-strip" style={{ marginBottom: 20 }}>
          <span className="online-dot" /> Online now
          <div className="online-avatars">
            {onlineFriends.map((f) => (
              <Link key={f.sub} {...f.onlineLinkProps} className="online-friend">
                {f.onlineAvatarImageProps ? <img className="avatar" {...f.onlineAvatarImageProps} /> : null}
                <span>{f.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {showHits && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="row-list">
            {hits.map((u) => (
              <div className="person-row" key={u.sub}>
                <Link {...u.profileLinkProps} className="person-link">
                  {u.avatarImageProps && <img className="avatar" {...u.avatarImageProps} />}
                  <span className="person-name">{u.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" {...u.requestButtonProps}>
                  Add friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showIncoming && (
        <>
          <h3>Requests for you</h3>
          <div className="row-list" style={{ marginBottom: 22 }}>
            {incoming.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps && <img className="avatar" {...f.avatarImageProps} />}
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

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showEmpty ? (
        <div className="empty">{emptyMessage}</div>
      ) : showCircle ? (
        <>
          <h3>Your circle</h3>
          <div className="row-list">
            {accepted.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps && <img className="avatar" {...f.avatarImageProps} />}
                  <div>
                    <div className="person-name">
                      {f.name}
                      {f.isOnline && <span className="online-dot" title="online" />}
                    </div>
                    <div className="person-stats">
                      {f.statsLabel}
                    </div>
                  </div>
                </Link>
                <span className="spacer" />
                <button title="Gift shares" {...f.giftButtonProps}>
                  🎁
                </button>
                <button className="danger" {...f.removeButtonProps}>
                  Remove
                </button>
              </div>
            ))}
            {outgoing.map((f) => (
              <div className="person-row" key={f.sub} style={{ opacity: 0.65 }}>
                <Link {...f.profileLinkProps} className="person-link">
                  {f.avatarImageProps && <img className="avatar" {...f.avatarImageProps} />}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="badge">pending</span>
                <span className="spacer" />
                <button {...f.cancelButtonProps}>Cancel</button>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <GiftDialog model={giftDialog} />
    </main>
  )
}
