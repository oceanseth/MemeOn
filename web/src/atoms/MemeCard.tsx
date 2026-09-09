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
    <div
      className={`meme-card ${tierClasses(model.tierKey)}`}
      data-glow-style={glowStyleFor(model.tierKey)}
    >
      <div className="meme-card-inner">
        <Link {...model.detailLinkProps}>
          {model.media.kind === 'video' ? (
            <video className="meme-art" {...model.media.videoProps} />
          ) : (
            <img className="meme-art" {...model.media.imageProps} />
          )}
        </Link>
        <div className="meme-meta">
          <span className="meme-title">{model.title}</span>
          <span>
            <span className="tier-chip" style={{ color: model.tierColor }}>
              {model.tierLabel}
            </span>
          </span>
          <span className="meme-sub">
            <span>
              👁️ {model.viewsLabel} · 🔁 {model.resharesLabel}
            </span>
            <span>🧠 {model.valueLabel}</span>
          </span>
          {model.listing && (
            <span className="meme-sub">
              <span className="badge">for sale</span>
              <span>{model.listing.sharesLabel}</span>
            </span>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}
