import { Link } from 'react-router-dom'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { GiftDialog } from '../molecules/GiftDialog'

/** Friends list as a function of its model. Every engine state is one set of args. */
export function FriendsScreen({
  query,
  hits,
  msg,
  inviteLabel,
  onlineFriends,
  incoming,
  outgoing,
  accepted,
  onlineSubs,
  showMsg,
  showOnline,
  showHits,
  showIncoming,
  showLoading,
  showEmpty,
  showCircle,
  emptyMessage,
  gifting,
  giftMemes,
  giftQuery,
  giftPick,
  giftShares,
  giftBusy,
  giftErr,
  giftOpen,
  onQueryChange,
  onCopyInvite,
  onRequest,
  onRespond,
  onRemove,
  onGiftOpen,
  onGiftQueryChange,
  onGiftPick,
  onGiftSharesChange,
  onGiftClose,
  onGiftSubmit,
}: FriendsScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2>Friends</h2>
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Find people by name…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button className="primary" onClick={onCopyInvite}>
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
              <Link key={f.sub} to={`/u/${encodeURIComponent(f.sub)}`} className="online-friend" title={f.name}>
                {f.picture ? <img className="avatar" src={f.picture} alt={f.name} /> : null}
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
                <Link to={`/u/${encodeURIComponent(u.sub)}`} className="person-link">
                  {u.picture && <img className="avatar" src={u.picture} alt="" />}
                  <span className="person-name">{u.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" onClick={() => onRequest(u.sub)}>
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
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" onClick={() => onRespond(f.sub, true)}>
                  Accept
                </button>
                <button className="danger" onClick={() => onRespond(f.sub, false)}>
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
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <div>
                    <div className="person-name">
                      {f.name}
                      {onlineSubs.includes(f.sub) && <span className="online-dot" title="online" />}
                    </div>
                    <div className="person-stats">
                      📚 {f.collectionSize} memes · 🧠 {f.portfolioValue.toLocaleString()} portfolio
                    </div>
                  </div>
                </Link>
                <span className="spacer" />
                <button title="Gift shares" onClick={() => onGiftOpen({ sub: f.sub, name: f.name })}>
                  🎁
                </button>
                <button className="danger" onClick={() => onRemove(f.sub)}>
                  Remove
                </button>
              </div>
            ))}
            {outgoing.map((f) => (
              <div className="person-row" key={f.sub} style={{ opacity: 0.65 }}>
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="badge">pending</span>
                <span className="spacer" />
                <button onClick={() => onRemove(f.sub)}>Cancel</button>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <GiftDialog
        open={giftOpen}
        recipient={gifting}
        memes={giftMemes}
        query={giftQuery}
        onQueryChange={onGiftQueryChange}
        pick={giftPick}
        onPick={onGiftPick}
        shares={giftShares}
        onSharesChange={onGiftSharesChange}
        busy={giftBusy}
        error={giftErr}
        onClose={onGiftClose}
        onSubmit={onGiftSubmit}
      />
    </main>
  )
}
