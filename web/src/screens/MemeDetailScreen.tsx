import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { tierClasses } from '../atoms/MemeCard'
import type { MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { MemeplexPanel } from '../organisms/MemeplexPanel'

/** Meme detail as a function of its engine-provided model. */
export function MemeDetailScreen({ showNotFound, showLoading, notFound, loadingLabel, detail }: MemeDetailScreenModel) {
  if (showNotFound) return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="empty" role="status" style={{ marginTop: 60 }}>
        <p>{notFound.message}</p>
        <div className="empty-actions"><Link className="btn" {...notFound.linkProps}>{notFound.linkLabel}</Link></div>
      </div>
    </main>
  )
  if (showLoading || !detail) return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="loading-state" role="status"><span className="spin" aria-hidden="true" />{loadingLabel}</div>
    </main>
  )

  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="detail-layout">
        <div className="detail-rail" style={{ alignSelf: 'start' }}>
          <div className={`meme-card meme-card-lg ${tierClasses(detail.tierKey)}`} data-glow-style={glowStyleFor(detail.tierKey)}>
            <div className="meme-card-inner">
              {detail.media.kind === 'video' ? <video className="meme-art" {...detail.media.videoProps} /> : <img className="meme-art" {...detail.media.imageProps} />}
              <div className="meme-meta">
                <span className="meme-title">{detail.title}</span>
                <span><span className="tier-chip" style={{ color: detail.tierColor }}>{detail.tierLabel}</span></span>
                <span className="meme-sub">
                  <span><span aria-hidden="true">👁️ {detail.viewsLabel} · 🔁 {detail.resharesLabel}</span><span className="sr-only">{detail.statsSrLabel}</span></span>
                  <span><span aria-hidden="true">🧠 {detail.valueLabel}</span><span className="sr-only">{detail.valueSrLabel}</span></span>
                </span>
                {detail.listing && <span className="meme-sub"><span className="badge">for sale</span><span>{detail.listing.cardLabel}</span></span>}
              </div>
            </div>
          </div>
          <div className="tier-ladder" style={{ color: detail.tierColor }}>
            <div className="tier-ladder-track" {...detail.tierLadder.meterProps}><div className="tier-ladder-fill" style={detail.tierLadder.fillStyle} /></div>
            <p className="tier-ladder-next">{detail.tierLadder.nextLabel}</p>
          </div>
        </div>
        <div>
          <h2 style={{ marginTop: 0 }}>{detail.title}{detail.private && <span className="badge" style={{ marginLeft: 10, verticalAlign: 'middle' }}>🙈 private</span>}</h2>
          <p className="muted">
            minted by <Link {...detail.creatorLinkProps}>{detail.creatorName}</Link> · owned by <Link {...detail.ownerLinkProps}>{detail.ownerName}</Link>
            {detail.tagsLabel && <> · {detail.tagsLabel}</>}
            {detail.remixLinkProps && <> · <Link {...detail.remixLinkProps}>🧬 remix</Link></>}
            {detail.sourceLinkProps && <> · <a {...detail.sourceLinkProps}>{detail.sourceLabel}</a></>}
          </p>
          <p style={{ fontSize: 18 }}>👁️ <strong>{detail.viewsLabel}</strong> {detail.viewsWord} · 🔁 <strong>{detail.resharesLabel}</strong> {detail.resharesWord} · 🧠 <strong>{detail.valueLabel}</strong> card value{detail.holdingsLabel && <> · you hold <strong>{detail.holdingsLabel}</strong></>}</p>
          <p className="muted" style={{ fontSize: 14 }}>{detail.tierHype}</p>
          {detail.signedOut && <div className="panel" style={{ marginBottom: 16 }}>
            <h3>{detail.signedOut.title}</h3>
            <p className="muted" style={{ fontSize: 13.5, margin: '6px 0 10px' }}>{detail.signedOut.body}</p>
            <div className="filter-bar">
              <button className="primary" {...detail.signedOut.loginButtonProps}>{detail.signedOut.loginLabel}</button>
              <Link className="btn" {...detail.signedOut.browseLinkProps}>{detail.signedOut.browseLabel}</Link>
            </div>
            {detail.signedOut.error && <p className="notice error" {...detail.signedOut.errorProps}>{detail.signedOut.error}</p>}
          </div>}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3>Share to go viral</h3><p className="muted" style={{ fontSize: 13.5, margin: '6px 0 10px' }}>Every load of this link counts a view (views drive the tier ladder); each new place it's shared — a subreddit, a group chat, an unfurl — counts a reshare.</p>
            <div className="filter-bar"><input {...detail.shareInputProps} style={{ flex: 1, minWidth: 200 }} /><button className="primary" {...detail.copyButtonProps}>{detail.copyButtonLabel}</button><a className="btn" {...detail.previewLinkProps}>Preview card</a></div>
          </div>
          {detail.actions.length > 0 && <div className="filter-bar" style={{ marginBottom: 16 }}>{detail.actions.map((action) => <button key={action.label} className={action.className} {...action.buttonProps}>{action.label}</button>)}</div>}
          <div {...detail.noticeProps}>{detail.notice && <p className="notice ok">{detail.notice}</p>}</div>
          <div {...detail.errorProps}>{detail.error && <p className="notice error">{detail.error}</p>}</div>
          {detail.listing ? <div className="panel" style={{ marginBottom: 16 }}>
            <h3>{detail.listing.saleLabel}</h3>
            {detail.listing.showBuy && <>
              <div className="filter-bar" style={{ marginTop: 10 }}>
                <label className="field-label">{detail.listing.buyLabel}<input type="number" {...detail.listing.buyInputProps} style={{ width: 90 }} /></label>
                <button className="primary" {...detail.listing.buyButtonProps}>{detail.listing.buyButtonLabel}</button>
                {detail.listing.balanceLabel && <span className="muted" style={{ fontSize: 13 }}>{detail.listing.balanceLabel}</span>}
              </div>
              {detail.listing.disabledReason && <p className="field-hint">{detail.listing.disabledReason}</p>}
            </>}
            {detail.listing.showUnlist && <div className="filter-bar" style={{ marginTop: 10 }}><button className="danger" {...detail.listing.unlistButtonProps}>{detail.listing.unlistButtonLabel}</button></div>}
          </div> : detail.list.show ? <div className="panel" style={{ marginBottom: 16 }}>
            <h3>List shares for sale</h3><div className="filter-bar" style={{ marginTop: 10 }}>
              <label className="field-label">shares <input type="number" {...detail.list.sharesInputProps} style={{ width: 80 }} /></label>
              <label className="field-label"><span><span aria-hidden="true">🧠/share</span><span className="sr-only">braincells per share</span></span><input type="number" {...detail.list.priceInputProps} style={{ width: 90 }} /></label>
              <button className="primary" {...detail.list.listButtonProps}>{detail.list.listButtonLabel}</button>
            </div>
            {detail.list.disabledReason && <p className="field-hint">{detail.list.disabledReason}</p>}
          </div> : null}
          {detail.sources.length > 0 && <div className="panel" style={{ marginBottom: 16 }}><h3>📡 Where it's spreading</h3><div className="row-list" style={{ marginTop: 10 }}>{detail.sources.map((source) => <div key={source.id} className="person-row" style={{ padding: 9 }}><span style={{ fontSize: 13.5 }}>{source.linkProps ? <a {...source.linkProps}>{source.label}</a> : source.label}</span><span className="spacer" /><span className="muted" style={{ fontSize: 13 }}>👁️ {source.viewsLabel}</span></div>)}</div></div>}
          <MemeplexPanel model={detail.plex} />
          <div className="panel" style={{ marginTop: 16 }}><h3>{detail.capTableTitle}</h3><div className="row-list" style={{ marginTop: 10 }}>{detail.capTable.map((holder) => <div key={holder.userId} className="person-row cap-row"><span className="person-name">{holder.label}</span><span className="spacer" /><span>{holder.sharesLabel}</span></div>)}</div></div>
        </div>
      </div>
      <ConfirmDialog model={detail.deleteDialog} />
      <ConfirmDialog model={detail.buyDialog} />
      <ConfirmDialog model={detail.claimDialog} />
    </main>
  )
}
