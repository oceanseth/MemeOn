import { Link } from 'react-router-dom'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { TradeCard } from '../molecules/TradeCard'

const SKELETON_ROWS = ['a', 'b', 'c']

/** Trade lists and a controlled compose panel as a function of its model. */
export function TradesScreen({
  newTradeButtonLabel,
  newTradeButtonProps,
  compose,
  open,
  history,
  msg,
  noticeProps,
  err,
  errorNoticeProps,
  showErrorNotice,
  showError,
  retryButtonProps,
  showLoading,
  loadingProps,
  loadingLabel,
  showLists,
  confirmDialog,
}: TradesScreenModel) {
  return <main className="container" id="main" tabIndex={-1}>
    <div className="page-head"><h2>Trade</h2><button className="primary" {...newTradeButtonProps}>{newTradeButtonLabel}</button></div>
    {/* both regions are mounted in every state and only their text swaps: a live region inserted
        together with its content is commonly missed, and this is the irreversible surface */}
    <div className="live-region" {...noticeProps}>{msg && <p className="notice ok">{msg}</p>}</div>
    <div className="live-region" {...errorNoticeProps}>{showErrorNotice && <p className="notice error">{err}</p>}</div>
    <div className="stack-lg">
      {compose && (compose.noFriends
        ? <div className="empty">
            <p>Trading needs a friend first.</p>
            <div className="empty-actions"><Link className="btn primary" to="/friends">Find your people</Link></div>
          </div>
        : <div className="panel">
            <form className="form-grid trade-compose" {...compose.formProps}>
              <fieldset className="trade-fieldset">
                <legend>You give</legend>
                <div className="form-grid">
                  <label>Trade with<select {...compose.friendSelectProps}><option value="">Pick a friend…</option>{compose.friends.map((friend) => <option key={friend.sub} value={friend.sub}>{friend.name}</option>)}</select></label>
                  <label>You give (from your binder)<select {...compose.offerMemeSelectProps}><option value="">— braincells only, no meme —</option>{compose.binderOptions.map((meme) => <option key={meme.id} value={meme.id}>{meme.label}</option>)}</select></label>
                  {compose.showOfferShares && <label>Shares to give<input type="number" {...compose.offerSharesInputProps} /><span className="field-hint">{compose.offerSharesHint}</span></label>}
                  <label>Braincells you add<input type="number" {...compose.offerCoinsInputProps} /><span className="field-hint">{compose.offerCoinsHint}</span></label>
                </div>
              </fieldset>
              <fieldset className="trade-fieldset">
                <legend>You want</legend>
                <div className="form-grid">
                  <label>You want (their memes)<select {...compose.askMemeSelectProps}><option value="">— braincells only, no meme —</option>{compose.theirMemeOptions.map((meme) => <option key={meme.id} value={meme.id}>{meme.label}</option>)}</select></label>
                  {compose.showAskShares && <label>Shares you want<input type="number" {...compose.askSharesInputProps} /></label>}
                  <label>Braincells you want<input type="number" {...compose.askCoinsInputProps} /></label>
                </div>
              </fieldset>
              {compose.error && <p className="notice error" {...compose.errorNoticeProps}>{compose.error}</p>}
              <div><button className="primary" type="submit" {...compose.proposeButtonProps}>Propose trade</button></div>
            </form>
          </div>)}
      {showLoading && <div className="row-list" {...loadingProps}>
        <span className="sr-only">{loadingLabel}</span>
        {SKELETON_ROWS.map((row) => <div key={row} className="skeleton skeleton-row trade-card-skeleton" aria-hidden="true" />)}
      </div>}
      {showError && <div className="empty error" {...errorNoticeProps}>
        <p><strong>{err}</strong></p>
        <div className="empty-actions"><button className="primary" {...retryButtonProps}>Try again</button></div>
      </div>}
      {showLists && <>
        <section aria-labelledby="trades-open">
          <h3 id="trades-open">Open proposals</h3>
          {open.length === 0 ? <div className="empty">Nothing pending. Propose something outrageous.</div> : <div className="row-list">{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
        <section aria-labelledby="trades-history">
          <h3 id="trades-history">History</h3>
          {history.length === 0 ? <div className="empty">No trade history yet.</div> : <div className="row-list">{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
      </>}
    </div>
    <ConfirmDialog model={confirmDialog} />
  </main>
}
