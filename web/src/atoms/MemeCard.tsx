import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import type { MemeCardModel } from '../lib/memeCardModel'

const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

export function tierClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `glow-border tier-${tierKey}${sheen}${sparkle}`
}

export function MemeCard({
  model,
  footer,
}: {
  model: MemeCardModel
  footer?: ReactNode | undefined
}) {
  return (
    <article
      ref={model.cardRef}
      className={`meme-card ${tierClasses(model.tierKey)}`}
      aria-labelledby={model.titleId}
      data-glow-style={glowStyleFor(model.tierKey)}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div className="meme-card-inner">
        {/* .foil-media bounds the sheen and the sparkle to the art, so neither sweeps the meta text */}
        <span className="foil-media">
          <Link {...model.detailLinkProps}>
            {model.media.kind === 'video' ? (
              <video className="meme-art" {...model.media.videoProps} />
            ) : (
              <img className="meme-art" {...model.media.imageProps} />
            )}
          </Link>
          {model.media.kind === 'video' && (
            <button className="meme-media-toggle" {...model.media.toggleProps}>
              <span aria-hidden="true">⏯</span>
            </button>
          )}
        </span>
        <div className="meme-meta">
          <span className="meme-title" id={model.titleId}>
            {model.title}
          </span>
          <span>
            <span className="tier-chip" style={{ color: model.tierColor }}>
              {model.tierLabel}
            </span>
          </span>
          <span className="meme-sub">
            <span>
              <span aria-hidden="true">
                {model.viewsLabel !== null && <>👁️ {model.viewsLabel} · </>}🔁{' '}
                {model.resharesLabel}
              </span>
              <span className="sr-only">{model.statsA11yLabel}</span>
            </span>
            <span>
              <span aria-hidden="true">🧠 {model.valueLabel}</span>
              <span className="sr-only">{model.valueA11yLabel}</span>
            </span>
          </span>
          {model.listing && (
            <span className="meme-sub">
              <span className="badge">for sale</span>
              <span aria-hidden="true">{model.listing.sharesLabel}</span>
              <span className="sr-only">{model.listing.sharesA11yLabel}</span>
            </span>
          )}
          {footer}
        </div>
      </div>
    </article>
  )
}
