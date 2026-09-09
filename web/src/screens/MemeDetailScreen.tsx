import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { tierClasses } from '../atoms/MemeCard'
import type { MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { MemeplexPanel } from '../organisms/MemeplexPanel'

/** Meme detail as a function of its engine-provided model. */
export function MemeDetailScreen({ showNotFound, showLoading, detail }: MemeDetailScreenModel) {
  if (showNotFound) return <main className="container"><div className="empty" style={{ marginTop: 60 }}>This meme doesn't exist (yet).</div></main>
  if (showLoading || !detail) return <main className="container" style={{ paddingTop: 80, textAlign: 'center' }}><span className="spin" /></main>

  return (
    <main className="container">
      <div className="detail-layout">
        <div className={`meme-card meme-card-lg ${tierClasses(detail.tierKey)}`} data-glow-style={glowStyleFor(detail.tierKey)} style={{ alignSelf: 'start' }}>
          <div className="meme-card-inner">
            {detail.media.kind === 'video' ? <video className="meme-art" {...detail.media.videoProps} /> : <img className="meme-art" {...detail.media.imageProps} />}
            <div className="meme-meta">
              <span className="meme-title">{detail.title}</span>
              <span><span className="tier-chip" style={{ color: detail.tierColor }}>{detail.tierLabel}</span></span>
              <span className="meme-sub"><span>👁️ {detail.viewsLabel} · 🔁 {detail.resharesLabel}</span><span>🧠 {detail.valueLabel}</span></span>
              {detail.listing && <span className="meme-sub"><span className="badge">for sale</span><span>{detail.listing.cardLabel}</span></span>}
            </div>
          </div>
        </div>
        <div>
          <h2 style={{ marginTop: 0 }}>{detail.title}{detail.private && <span className="badge" style={{ marginLeft: 10, verticalAlign: 'middle' }}>🙈 private</span>}</h2>
          <p style={{ color: 'var(--text-dim)' }}>
            minted by <Link {...detail.creatorLinkProps}>{detail.creatorName}</Link> · owned by <Link {...detail.ownerLinkProps}>{detail.ownerName}</Link>
            {detail.tagsLabel && <> · {detail.tagsLabel}</>}
            {detail.remixLinkProps && <> · <Link {...detail.remixLinkProps}>🧬 remix</Link></>}
            {detail.sourceLinkProps && <> · <a {...detail.sourceLinkProps}>{detail.sourceLabel}</a></>}
          </p>
          <p style={{ fontSize: 18 }}>👁️ <strong>{detail.viewsLabel}</strong> views · 🔁 <strong>{detail.resharesLabel}</strong> reshares · 🧠 <strong>{detail.valueLabel}</strong> value{detail.holdingsLabel && <> · you hold <strong>{detail.holdingsLabel}</strong></>}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{detail.tierHype}</p>
          <div className="panel" style={{ marginBottom: 16 }}>
            <strong>Share to go viral</strong><p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '6px 0 10px' }}>Every load of this link counts a view (views drive the tier ladder); each new place it's shared — a subreddit, a group chat, an unfurl — counts a reshare.</p>
            <div className="filter-bar"><input {...detail.shareInputProps} style={{ flex: 1, minWidth: 200 }} /><button className="primary" {...detail.copyButtonProps}>{detail.copyButtonLabel}</button><a {...detail.previewLinkProps}><button>Preview card</button></a></div>
          </div>
          <div className="filter-bar" style={{ marginBottom: 16 }}>{detail.actions.map((action) => <button key={action.label} className={action.className} {...action.buttonProps}>{action.label}</button>)}</div>
          {detail.notice && <p className="notice ok">{detail.notice}</p>}{detail.error && <p className="notice error">{detail.error}</p>}
          {detail.listing ? <div className="panel" style={{ marginBottom: 16 }}>
            <strong>{detail.listing.saleLabel}</strong>
            {detail.listing.showBuy && <div className="filter-bar" style={{ marginTop: 10 }}><input type="number" {...detail.listing.buyInputProps} style={{ width: 90 }} /><button className="primary" {...detail.listing.buyButtonProps}>{detail.listing.buyButtonLabel}</button></div>}
            {detail.listing.showUnlist && <div className="filter-bar" style={{ marginTop: 10 }}><button className="danger" {...detail.listing.unlistButtonProps}>Remove listing</button></div>}
          </div> : detail.list.show ? <div className="panel" style={{ marginBottom: 16 }}>
            <strong>List shares for sale</strong><div className="filter-bar" style={{ marginTop: 10 }}>
              <label style={{ fontSize: 13 }}>shares <input type="number" {...detail.list.sharesInputProps} style={{ width: 80 }} /></label>
              <label style={{ fontSize: 13 }}>🧠/share <input type="number" {...detail.list.priceInputProps} style={{ width: 90 }} /></label>
              <button className="primary" {...detail.list.listButtonProps}>List</button>
            </div>
          </div> : null}
          {detail.sources.length > 0 && <div className="panel" style={{ marginBottom: 16 }}><strong>📡 Where it's spreading</strong><div className="row-list" style={{ marginTop: 10 }}>{detail.sources.map((source) => <div key={source.id} className="person-row" style={{ padding: 9 }}><span style={{ fontSize: 13.5 }}>{source.linkProps ? <a {...source.linkProps}>{source.label}</a> : source.label}</span><span className="spacer" /><span style={{ color: 'var(--text-dim)', fontSize: 13 }}>👁️ {source.viewsLabel}</span></div>)}</div></div>}
          <MemeplexPanel model={detail.plex} />
          <div className="panel" style={{ marginTop: 16 }}><strong>Cap table</strong><div className="row-list" style={{ marginTop: 10 }}>{detail.capTable.map((holder) => <div key={holder.userId} className="person-row"><span className="person-name">{holder.label}</span><span className="spacer" /><span>{holder.sharesLabel}</span></div>)}</div></div>
        </div>
      </div>
      <ConfirmDialog model={detail.deleteDialog} />
    </main>
  )
}
