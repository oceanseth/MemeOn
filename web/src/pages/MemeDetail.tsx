import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { tierClasses } from '../components/MemeCard'
import type { Meme, Position } from '../lib/types'

export default function MemeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [meme, setMeme] = useState<Meme | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [notFound, setNotFound] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
          </p>
          <p style={{ fontSize: 18 }}>
            🔁 <strong>{meme.reshares.toLocaleString()}</strong> reshares · 🧠{' '}
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
              Every load of this link (Discord unfurls included) counts a reshare and upgrades the
              link-preview card frame at each tier.
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

          <div className="panel">
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
