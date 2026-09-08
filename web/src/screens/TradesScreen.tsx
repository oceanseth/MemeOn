import type { Trade, TradeSide } from '../lib/types'
import type { TradeAction, TradesScreenModel } from '../hooks/useTradesScreen'

const STATUS_BADGE: Record<Trade['status'], string> = {
  proposed: '⏳ proposed',
  accepted: '✅ accepted',
  declined: '❌ declined',
  cancelled: '🚫 cancelled',
}

function SideSummary({
  side,
  owner,
  memeNames,
}: {
  side: TradeSide
  owner: string
  memeNames: Record<string, string>
}) {
  return (
    <div className="trade-side">
      <h4>{owner} gives</h4>
      {side.memes.length === 0 && side.coins === 0 && <div>nothing 😶</div>}
      {side.memes.map((m) => (
        <div key={m.memeId}>
          {m.shares} shares of <em>"{memeNames[m.memeId] ?? m.memeId}"</em>
        </div>
      ))}
      {side.coins > 0 && <div>🧠 {side.coins.toLocaleString()}</div>}
    </div>
  )
}

function TradeCard({
  trade,
  me,
  memeNames,
  onRespond,
}: {
  trade: Trade
  me: string
  memeNames: Record<string, string>
  onRespond?: ((t: Trade, action: TradeAction) => void) | undefined
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
        <SideSummary side={trade.offer} owner={trade.fromName} memeNames={memeNames} />
        <div style={{ fontSize: 22 }}>⇄</div>
        <SideSummary side={trade.ask} owner={trade.toName} memeNames={memeNames} />
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

/** Trades list + compose form as a function of its model. Every engine state is one set of args. */
export function TradesScreen({
  open,
  history,
  msg,
  composeErr,
  showNew,
  friends,
  binder,
  theirMemes,
  toId,
  offerMeme,
  offerShares,
  offerCoins,
  askMeme,
  askShares,
  askCoins,
  memeNames,
  meSub,
  showLoading,
  showLists,
  showOfferShares,
  showAskShares,
  canPropose,
  onToggleNew,
  onRespond,
  onToIdChange,
  onOfferMemeChange,
  onOfferSharesChange,
  onOfferCoinsChange,
  onAskMemeChange,
  onAskSharesChange,
  onAskCoinsChange,
  onPropose,
}: TradesScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2>Trade</h2>
        <button className="primary" onClick={onToggleNew}>
          {showNew ? 'Close' : '＋ Propose a trade'}
        </button>
      </div>

      {msg && <p className="notice ok">{msg}</p>}
      {showNew && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="form-grid">
            <label>
              Trade with
              <select value={toId} onChange={(e) => onToIdChange(e.target.value)}>
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
              <select value={offerMeme} onChange={(e) => onOfferMemeChange(e.target.value)}>
                <option value="">— no meme, coins only —</option>
                {binder.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} (you hold {m.myShares})
                  </option>
                ))}
              </select>
            </label>
            {showOfferShares && (
              <label>
                Shares to give
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={offerShares}
                  onChange={(e) => onOfferSharesChange(Number(e.target.value))}
                />
              </label>
            )}
            <label>
              Braincells you add
              <input
                type="number"
                min={0}
                value={offerCoins}
                onChange={(e) => onOfferCoinsChange(Number(e.target.value))}
              />
            </label>

            <label>
              You want (their memes)
              <select value={askMeme} onChange={(e) => onAskMemeChange(e.target.value)}>
                <option value="">— no meme, coins only —</option>
                {theirMemes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            {showAskShares && (
              <label>
                Shares you want
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={askShares}
                  onChange={(e) => onAskSharesChange(Number(e.target.value))}
                />
              </label>
            )}
            <label>
              Braincells you want
              <input
                type="number"
                min={0}
                value={askCoins}
                onChange={(e) => onAskCoinsChange(Number(e.target.value))}
              />
            </label>

            {composeErr && <p className="notice error">{composeErr}</p>}
            <div>
              <button className="primary" disabled={!canPropose} onClick={onPropose}>
                Propose trade
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showLists ? (
        <>
          <h3>Open proposals</h3>
          {open.length === 0 ? (
            <div className="empty">Nothing pending. Propose something outrageous.</div>
          ) : (
            <div className="row-list">
              {open.map((t) => (
                <TradeCard
                  key={t.id}
                  trade={t}
                  me={meSub}
                  memeNames={memeNames}
                  onRespond={onRespond}
                />
              ))}
            </div>
          )}
          <h3 style={{ marginTop: 34 }}>History</h3>
          {history.length === 0 ? (
            <div className="empty">No trade history yet.</div>
          ) : (
            <div className="row-list">
              {history.map((t) => (
                <TradeCard key={t.id} trade={t} me={meSub} memeNames={memeNames} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </main>
  )
}
