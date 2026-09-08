import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { tierClasses } from '../atoms/MemeCard'
import type { MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { MemeplexPanel } from '../organisms/MemeplexPanel'

/** Meme detail as a function of its model. Every engine state is one set of args. */
export function MemeDetailScreen({
  meme,
  stats,
  capTable,
  msg,
  err,
  copied,
  confirmingDelete,
  deleting,
  price,
  sellShares,
  buyShares,
  plex,
  plexBinder,
  plexPick,
  plexPasted,
  plexMsg,
  shareUrl,
  myShares,
  isSeller,
  showNotFound,
  showLoading,
  showUserActions,
  showClaim,
  showVisibility,
  showDelete,
  canEditPlex,
  onCopyShare,
  onRemix,
  onClaim,
  onToggleVisibility,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onBuySharesChange,
  onBuy,
  onUnlist,
  onSellSharesChange,
  onPriceChange,
  onList,
  onPlexPickChange,
  onPlexPastedChange,
  onPlexAdd,
}: MemeDetailScreenModel) {
  if (showNotFound)
    return (
      <main className="container">
        <div className="empty" style={{ marginTop: 60 }}>
          This meme doesn't exist (yet).
        </div>
      </main>
    )

  if (showLoading || !meme)
    return (
      <main className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  return (
    <main className="container">
      <div className="detail-layout">
        <div
          className={`meme-card meme-card-lg ${tierClasses(meme.tier.key)}`}
          data-glow-style={glowStyleFor(meme.tier.key)}
          style={{ alignSelf: 'start' }}
        >
          <div className="meme-card-inner">
            {meme.mediaType === 'video' && meme.videoUrl ? (
              // muted+playsInline is required for browsers to allow autoplay
              <video
                className="meme-art"
                src={meme.videoUrl}
                controls
                loop
                autoPlay
                muted
                playsInline
                poster={meme.imageUrl}
              />
            ) : (
              <img className="meme-art" src={meme.imageUrl} alt={meme.title} />
            )}
            <div className="meme-meta">
              <span className="meme-title">{meme.title}</span>
              <span>
                <span className="tier-chip" style={{ color: meme.tier.color }}>
                  {meme.tier.name} · {meme.tier.rarity}
                </span>
              </span>
              <span className="meme-sub">
                <span>
                  👁️ {(meme.views ?? meme.reshares).toLocaleString()} · 🔁{' '}
                  {(meme.reshareCount ?? 0).toLocaleString()}
                </span>
                <span>🧠 {meme.value.toLocaleString()}</span>
              </span>
              {meme.listing && meme.listing.shares > 0 && (
                <span className="meme-sub">
                  <span className="badge">for sale</span>
                  <span>
                    {meme.listing.shares} sh @ 🧠{meme.listing.pricePerShare}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ marginTop: 0 }}>
            {meme.title}
            {meme.private && (
              <span className="badge" style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                🙈 private
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-dim)' }}>
            minted by <Link to={`/u/${encodeURIComponent(meme.creatorId)}`}>{meme.creatorName}</Link>{' '}
            · owned by <Link to={`/u/${encodeURIComponent(meme.ownerId)}`}>{meme.ownerName}</Link>
            {meme.tags.length > 0 && <> · {meme.tags.map((t) => `#${t}`).join(' ')}</>}
            {meme.remixOf && (
              <>
                {' '}
                · <Link to={`/m/${meme.remixOf}`}>🧬 remix</Link>
              </>
            )}
            {meme.source && (
              <>
                {' '}
                ·{' '}
                <a href={meme.source.url} target="_blank" rel="noreferrer">
                  via {meme.source.provider.toUpperCase()}
                  {meme.source.author ? ` (@${meme.source.author})` : ''}
                </a>
              </>
            )}
          </p>
          <p style={{ fontSize: 18 }}>
            👁️ <strong>{(meme.views ?? meme.reshares).toLocaleString()}</strong> views · 🔁{' '}
            <strong>{(meme.reshareCount ?? 0).toLocaleString()}</strong> reshares · 🧠{' '}
            <strong>{meme.value.toLocaleString()}</strong> value
            {myShares > 0 && (
              <>
                {' '}
                · you hold <strong>{myShares}/100</strong>
              </>
            )}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{meme.tier.hype}</p>

          <div className="panel" style={{ marginBottom: 16 }}>
            <strong>Share to go viral</strong>
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '6px 0 10px' }}>
              Every load of this link counts a view (views drive the tier ladder); each new place
              it's shared — a subreddit, a group chat, an unfurl — counts a reshare.
            </p>
            <div className="filter-bar">
              <input readOnly value={shareUrl} style={{ flex: 1, minWidth: 200 }} />
              <button className="primary" onClick={onCopyShare}>
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
              <a href={`/api/memes/${meme.id}/og.png`} target="_blank" rel="noreferrer">
                <button>Preview card</button>
              </a>
            </div>
          </div>

          <div className="filter-bar" style={{ marginBottom: 16 }}>
            {showUserActions && (
              <button onClick={onRemix}>🧬 Create a meme from this</button>
            )}
            {showClaim && (
              <button onClick={onClaim}>📼 This is my meme — claim it</button>
            )}
            {showVisibility && (
              <button onClick={onToggleVisibility}>
                {meme.private ? '🌐 Make public' : '🙈 Make private'}
              </button>
            )}
            {showDelete && (
              <button className="danger" onClick={onAskDelete}>
                🗑️ Delete forever
              </button>
            )}
          </div>

          {msg && <p className="notice ok">{msg}</p>}
          {err && <p className="notice error">{err}</p>}

          {meme.listing && meme.listing.shares > 0 ? (
            <div className="panel" style={{ marginBottom: 16 }}>
              <strong>
                On sale: {meme.listing.shares} shares @ 🧠{meme.listing.pricePerShare}/share
              </strong>
              {showUserActions && !isSeller && (
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <input
                    type="number"
                    min={1}
                    max={meme.listing.shares}
                    value={buyShares}
                    onChange={(e) => onBuySharesChange(Number(e.target.value))}
                    style={{ width: 90 }}
                  />
                  <button className="primary" onClick={onBuy}>
                    Buy for 🧠{Math.ceil(buyShares * meme.listing!.pricePerShare)}
                  </button>
                </div>
              )}
              {isSeller && (
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <button className="danger" onClick={onUnlist}>
                    Remove listing
                  </button>
                </div>
              )}
            </div>
          ) : (
            myShares > 0 && (
              <div className="panel" style={{ marginBottom: 16 }}>
                <strong>List shares for sale</strong>
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 13 }}>
                    shares{' '}
                    <input
                      type="number"
                      min={1}
                      max={myShares}
                      value={sellShares}
                      onChange={(e) => onSellSharesChange(Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    🧠/share{' '}
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={price}
                      onChange={(e) => onPriceChange(Number(e.target.value))}
                      style={{ width: 90 }}
                    />
                  </label>
                  <button className="primary" onClick={onList}>
                    List
                  </button>
                </div>
              </div>
            )
          )}

          {stats && stats.sources.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <strong>📡 Where it's spreading</strong>
              <div className="row-list" style={{ marginTop: 10 }}>
                {stats.sources.map((s) => (
                  <div key={s.source} className="person-row" style={{ padding: 9 }}>
                    <span style={{ fontSize: 13.5 }}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.source}
                        </a>
                      ) : (
                        s.source
                      )}
                    </span>
                    <span className="spacer" />
                    <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                      👁️ {s.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MemeplexPanel
            meme={meme}
            plex={plex}
            canEdit={canEditPlex}
            binder={plexBinder}
            pick={plexPick}
            onPickChange={onPlexPickChange}
            pasted={plexPasted}
            onPastedChange={onPlexPastedChange}
            notice={plexMsg}
            onAdd={onPlexAdd}
          />

          <div className="panel" style={{ marginTop: 16 }}>
            <strong>Cap table</strong>
            <div className="row-list" style={{ marginTop: 10 }}>
              {capTable.map((p) => (
                <div key={p.userId} className="person-row">
                  <span className="person-name">{p.label}</span>
                  <span className="spacer" />
                  <span>{p.shares}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        danger
        busy={deleting}
        title="Delete this meme forever?"
        message={
          <>
            <strong>"{meme.title}"</strong> will be permanently removed — its card, share link,
            view history, and memeplex links all go with it. This cannot be undone.
          </>
        }
        confirmLabel="Delete it forever"
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </main>
  )
}
