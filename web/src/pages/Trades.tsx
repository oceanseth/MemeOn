import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { FriendEntry, Meme, Trade, TradeSide } from '../lib/types'

const STATUS_BADGE: Record<Trade['status'], string> = {
  proposed: '⏳ proposed',
  accepted: '✅ accepted',
  declined: '❌ declined',
  cancelled: '🚫 cancelled',
}

export default function Trades() {
  const { user, refresh } = useAuth()
  const [trades, setTrades] = useState<Trade[] | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((r) => setTrades(r.trades))
      .catch(() => setTrades([]))
  }, [])

  useEffect(load, [load])

  const respond = async (trade: Trade, action: 'accept' | 'decline' | 'cancel') => {
    setMsg(null)
    try {
      await post(`/api/trades/${trade.id}/respond`, { action })
      if (action === 'accept') setMsg('Trade executed 🤝')
      load()
      void refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'action failed')
    }
  }

  const open = trades?.filter((t) => t.status === 'proposed') ?? []
  const history = trades?.filter((t) => t.status !== 'proposed') ?? []

  return (
    <main className="container">
      <div className="page-head">
        <h2>Trade</h2>
        <button className="primary" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Close' : '＋ Propose a trade'}
        </button>
      </div>

      {msg && <p className="notice ok">{msg}</p>}
      {showNew && (
        <NewTrade
          onDone={() => {
            setShowNew(false)
            load()
          }}
        />
      )}

      {trades === null ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : (
        <>
          <h3>Open proposals</h3>
          {open.length === 0 ? (
            <div className="empty">Nothing pending. Propose something outrageous.</div>
          ) : (
            <div className="row-list">
              {open.map((t) => (
                <TradeCard key={t.id} trade={t} me={user?.sub ?? ''} onRespond={respond} />
              ))}
            </div>
          )}
          <h3 style={{ marginTop: 34 }}>History</h3>
          {history.length === 0 ? (
            <div className="empty">No trade history yet.</div>
          ) : (
            <div className="row-list">
              {history.map((t) => (
                <TradeCard key={t.id} trade={t} me={user?.sub ?? ''} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

function SideSummary({ side, owner }: { side: TradeSide; owner: string }) {
  return (
    <div className="trade-side">
      <h4>{owner} gives</h4>
      {side.memes.length === 0 && side.coins === 0 && <div>nothing 😶</div>}
      {side.memes.map((m) => (
        <div key={m.memeId}>
          {m.shares} shares of <MemeName id={m.memeId} />
        </div>
      ))}
      {side.coins > 0 && <div>🪙 {side.coins.toLocaleString()}</div>}
    </div>
  )
}

const memeNameCache = new Map<string, string>()

function MemeName({ id }: { id: string }) {
  const [name, setName] = useState(memeNameCache.get(id) ?? id)
  useEffect(() => {
    if (memeNameCache.has(id)) return
    apiFetch<{ meme: Meme }>(`/api/memes/${id}`)
      .then((r) => {
        memeNameCache.set(id, r.meme.title)
        setName(r.meme.title)
      })
      .catch(() => {})
  }, [id])
  return <em>"{name}"</em>
}

function TradeCard({
  trade,
  me,
  onRespond,
}: {
  trade: Trade
  me: string
  onRespond?: (t: Trade, action: 'accept' | 'decline' | 'cancel') => void
}) {
  const mine = trade.fromId === me
  return (
    <div className="trade-card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <strong>
          {trade.fromName} ⇄ {trade.toName}
        </strong>
        <span className="badge">{STATUS_BADGE[trade.status]}</span>
        <span className="spacer" />
        <span style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
          {new Date(trade.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="trade-sides">
        <SideSummary side={trade.offer} owner={trade.fromName} />
        <div style={{ fontSize: 22 }}>⇄</div>
        <SideSummary side={trade.ask} owner={trade.toName} />
      </div>
      {trade.status === 'proposed' && onRespond && (
        <div className="filter-bar">
          {mine ? (
            <button className="danger" onClick={() => onRespond(trade, 'cancel')}>
              Cancel
            </button>
          ) : (
            <>
              <button className="primary" onClick={() => onRespond(trade, 'accept')}>
                Accept
              </button>
              <button className="danger" onClick={() => onRespond(trade, 'decline')}>
                Decline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NewTrade({ onDone }: { onDone: () => void }) {
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [binder, setBinder] = useState<Meme[]>([])
  const [allMemes, setAllMemes] = useState<Meme[]>([])
  const [toId, setToId] = useState('')
  const [offerMeme, setOfferMeme] = useState('')
  const [offerShares, setOfferShares] = useState(10)
  const [offerCoins, setOfferCoins] = useState(0)
  const [askMeme, setAskMeme] = useState('')
  const [askShares, setAskShares] = useState(10)
  const [askCoins, setAskCoins] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((r) => setFriends(r.friends.filter((f) => f.status === 'accepted')))
      .catch(() => {})
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => (m.myShares ?? 0) > 0)))
      .catch(() => {})
    apiFetch<{ memes: Meme[] }>('/api/memes')
      .then((r) => setAllMemes(r.memes))
      .catch(() => {})
  }, [])

  const propose = async () => {
    setBusy(true)
    setErr(null)
    try {
      const offer: TradeSide = {
        memes: offerMeme ? [{ memeId: offerMeme, shares: offerShares }] : [],
        coins: offerCoins,
      }
      const ask: TradeSide = {
        memes: askMeme ? [{ memeId: askMeme, shares: askShares }] : [],
        coins: askCoins,
      }
      await post('/api/trades', { toId, offer, ask })
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'proposal failed')
      setBusy(false)
    }
  }

  const theirMemes = useMemo(
    () => allMemes.filter((m) => m.ownerId === toId || m.creatorId === toId),
    [allMemes, toId],
  )

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div className="form-grid">
        <label>
          Trade with
          <select value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Pick a friend…</option>
            {friends.map((f) => (
              <option key={f.sub} value={f.sub}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          You give (from your binder)
          <select value={offerMeme} onChange={(e) => setOfferMeme(e.target.value)}>
            <option value="">— no meme, coins only —</option>
            {binder.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} (you hold {m.myShares})
              </option>
            ))}
          </select>
        </label>
        {offerMeme && (
          <label>
            Shares to give
            <input
              type="number"
              min={1}
              max={100}
              value={offerShares}
              onChange={(e) => setOfferShares(Number(e.target.value))}
            />
          </label>
        )}
        <label>
          Coins you add
          <input
            type="number"
            min={0}
            value={offerCoins}
            onChange={(e) => setOfferCoins(Number(e.target.value))}
          />
        </label>

        <label>
          You want (their memes)
          <select value={askMeme} onChange={(e) => setAskMeme(e.target.value)}>
            <option value="">— no meme, coins only —</option>
            {theirMemes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        {askMeme && (
          <label>
            Shares you want
            <input
              type="number"
              min={1}
              max={100}
              value={askShares}
              onChange={(e) => setAskShares(Number(e.target.value))}
            />
          </label>
        )}
        <label>
          Coins you want
          <input
            type="number"
            min={0}
            value={askCoins}
            onChange={(e) => setAskCoins(Number(e.target.value))}
          />
        </label>

        {err && <p className="notice error">{err}</p>}
        <div>
          <button className="primary" disabled={!toId || busy} onClick={propose}>
            Propose trade
          </button>
        </div>
      </div>
    </div>
  )
}
