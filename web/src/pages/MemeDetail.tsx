import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { tierClasses } from '../components/MemeCard'
import { MemeplexPanel } from '../components/MemeplexPanel'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Meme, Position } from '../lib/types'

const ARCHIVE_SUB = 'meme_archive'

interface MemeStats {
  views: number
  reshares: number
  sources: { source: string; url: string | null; views: number; firstSeen: string | null }[]
}

export default function MemeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [meme, setMeme] = useState<Meme | null>(null)
  const [stats, setStats] = useState<MemeStats | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [notFound, setNotFound] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // listing form
  const [price, setPrice] = useState(1)
  const [sellShares, setSellShares] = useState(10)
  const [buyShares, setBuyShares] = useState(1)

  const load = useCallback(() => {
    if (!id) return
    apiFetch<{ meme: Meme; positions: Position[] }>(`/api/memes/${id}`)
      .then((r) => {
        setMeme(r.meme)
        setPositions(r.positions)
      })
      .catch(() => setNotFound(true))
    apiFetch<MemeStats>(`/api/memes/${id}/stats`)
      .then(setStats)
      .catch(() => {})
  }, [id])

  useEffect(load, [load])

  if (notFound)
    return (
      <main className="container">
        <div className="empty" style={{ marginTop: 60 }}>
          This meme doesn't exist (yet).
        </div>
      </main>
    )

  if (!meme)
    return (
      <main className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  const myShares = positions.find((p) => p.userId === user?.sub)?.shares ?? 0
  const shareUrl = `${window.location.origin}/m/${meme.id}`
  const isSeller = meme.listing?.sellerId === user?.sub

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    setMsg(null)
    setErr(null)
    try {
      await fn()
      setMsg(okMsg)
      load()
      void refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'action failed')
    }
  }

  return (
    <main className="container">
      <div className="detail-layout">
        <div className={`meme-card ${tierClasses(meme.tier.key)}`} style={{ alignSelf: 'start' }}>
          <div className="meme-card-inner">
            {meme.mediaType === 'video' && meme.videoUrl ? (
              <video className="meme-art" src={meme.videoUrl} controls loop poster={meme.imageUrl} />
            ) : (
              <img className="meme-art" src={meme.imageUrl} alt={meme.title} />
            )}
            <div className="meme-meta">
              <span className="tier-chip" style={{ color: meme.tier.color, alignSelf: 'flex-start' }}>
                {meme.tier.name} · {meme.tier.rarity}
              </span>
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
                · <Link to={`/meme/${meme.remixOf}`}>🧬 remix</Link>
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
              <button className="primary" onClick={copyShare}>
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
              <a href={`/api/memes/${meme.id}/og.png`} target="_blank" rel="noreferrer">
                <button>Preview card</button>
              </a>
            </div>
          </div>

          <div className="filter-bar" style={{ marginBottom: 16 }}>
            {user && (
              <button onClick={() => navigate(`/binder/new?remix=${meme.id}`)}>
                🧬 Create a meme from this
              </button>
            )}
            {user && meme.creatorId === ARCHIVE_SUB && (
              <button
                onClick={() => {
                  const note = window.prompt(
                    'Tell us why this meme is yours (links help your case):',
                  )
                  if (note !== null)
                    void act(
                      () => post(`/api/memes/${meme.id}/claim`, { note }),
                      'Claim filed 📼 — we’ll review it and transfer the card if it checks out.',
                    )
                }}
              >
                📼 This is my meme — claim it
              </button>
            )}
            {myShares === 100 && (
              <button
                onClick={() =>
                  act(
                    () => post(`/api/memes/${meme.id}/visibility`, { private: !meme.private }),
                    meme.private
                      ? 'Back on the marketplace 🌐'
                      : 'Hidden from the marketplace 🙈 (still in your binder)',
                  )
                }
              >
                {meme.private ? '🌐 Make public' : '🙈 Make private'}
              </button>
            )}
            {myShares === 100 && meme.private && (
              <button className="danger" onClick={() => setConfirmingDelete(true)}>
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
              {user && !isSeller && (
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <input
                    type="number"
                    min={1}
                    max={meme.listing.shares}
                    value={buyShares}
                    onChange={(e) => setBuyShares(Number(e.target.value))}
                    style={{ width: 90 }}
                  />
                  <button
                    className="primary"
                    onClick={() =>
                      act(
                        () => post(`/api/memes/${meme.id}/buy`, { shares: buyShares }),
                        'Shares acquired 💼',
                      )
                    }
                  >
                    Buy for 🧠{Math.ceil(buyShares * meme.listing!.pricePerShare)}
                  </button>
                </div>
              )}
              {isSeller && (
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <button
                    className="danger"
                    onClick={() => act(() => post(`/api/memes/${meme.id}/unlist`, {}), 'Delisted')}
                  >
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
                      onChange={(e) => setSellShares(Number(e.target.value))}
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
                      onChange={(e) => setPrice(Number(e.target.value))}
                      style={{ width: 90 }}
                    />
                  </label>
                  <button
                    className="primary"
                    onClick={() =>
                      act(
                        () =>
                          post(`/api/memes/${meme.id}/list`, {
                            shares: sellShares,
                            pricePerShare: price,
                          }),
                        'Listed on the marketplace 🏷️',
                      )
                    }
                  >
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

          <MemeplexPanel meme={meme} canEdit={!!user && (meme.creatorId === user.sub || myShares > 0)} />

          <div className="panel" style={{ marginTop: 16 }}>
            <strong>Cap table</strong>
            <div className="row-list" style={{ marginTop: 10 }}>
              {positions.map((p) => (
                <div key={p.userId} className="person-row">
                  <span className="person-name">
                    {p.userId === user?.sub ? 'You' : <HolderName sub={p.userId} />}
                  </span>
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
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiFetch(`/api/memes/${meme.id}`, { method: 'DELETE' })
            navigate('/binder')
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'delete failed')
            setConfirmingDelete(false)
          } finally {
            setDeleting(false)
          }
        }}
      />
    </main>
  )
}

const nameCache = new Map<string, string>()

function HolderName({ sub }: { sub: string }) {
  const [name, setName] = useState(nameCache.get(sub) ?? `${sub.slice(0, 10)}…`)
  useEffect(() => {
    if (nameCache.has(sub)) return
    apiFetch<{ users: { sub: string; name: string }[] }>(`/api/users?q=`)
      .then((r) => {
        const hit = r.users.find((u) => u.sub === sub)
        if (hit) {
          nameCache.set(sub, hit.name)
          setName(hit.name)
        }
      })
      .catch(() => {})
  }, [sub])
  return <>{name}</>
}
