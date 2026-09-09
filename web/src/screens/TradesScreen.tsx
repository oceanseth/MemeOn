import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { TradeCard } from '../molecules/TradeCard'

/** Trade lists and a controlled compose panel as a function of its model. */
export function TradesScreen({ newTradeButtonLabel, newTradeButtonProps, compose, open, history, msg, showLoading, showLists }: TradesScreenModel) {
  return <main className="container">
    <div className="page-head"><h2>Trade</h2><button className="primary" {...newTradeButtonProps}>{newTradeButtonLabel}</button></div>
    {msg && <p className="notice ok">{msg}</p>}
    {compose && <div className="panel" style={{ marginBottom: 24 }}><div className="form-grid">
      <label>Trade with<select {...compose.friendSelectProps}><option value="">Pick a friend…</option>{compose.friends.map((friend) => <option key={friend.sub} value={friend.sub}>{friend.name}</option>)}</select></label>
      <label>You give (from your binder)<select {...compose.offerMemeSelectProps}><option value="">— no meme, coins only —</option>{compose.binderOptions.map((meme) => <option key={meme.id} value={meme.id}>{meme.label}</option>)}</select></label>
      {compose.showOfferShares && <label>Shares to give<input type="number" {...compose.offerSharesInputProps} /></label>}
      <label>Braincells you add<input type="number" {...compose.offerCoinsInputProps} /></label>
      <label>You want (their memes)<select {...compose.askMemeSelectProps}><option value="">— no meme, coins only —</option>{compose.theirMemeOptions.map((meme) => <option key={meme.id} value={meme.id}>{meme.label}</option>)}</select></label>
      {compose.showAskShares && <label>Shares you want<input type="number" {...compose.askSharesInputProps} /></label>}
      <label>Braincells you want<input type="number" {...compose.askCoinsInputProps} /></label>
      {compose.error && <p className="notice error">{compose.error}</p>}<div><button className="primary" {...compose.proposeButtonProps}>Propose trade</button></div>
    </div></div>}
    {showLoading ? <div className="empty"><span className="spin" /></div> : showLists ? <>
      <h3>Open proposals</h3>{open.length === 0 ? <div className="empty">Nothing pending. Propose something outrageous.</div> : <div className="row-list">{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
      <h3 style={{ marginTop: 34 }}>History</h3>{history.length === 0 ? <div className="empty">No trade history yet.</div> : <div className="row-list">{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
    </> : null}
  </main>
}
