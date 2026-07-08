import { Link } from 'react-router-dom'
import type { Meme } from '../lib/types'

const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

export function tierClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `tier-${tierKey}${sheen}${sparkle}`
}

export function MemeCard({ meme, footer }: { meme: Meme; footer?: React.ReactNode }) {
  return (
    <div className={`meme-card ${tierClasses(meme.tier.key)}`}>
      <div className="meme-card-inner">
        <Link to={`/m/${meme.id}`}>
          {meme.mediaType === 'video' && meme.videoUrl ? (
            <video className="meme-art" src={meme.videoUrl} muted loop playsInline autoPlay poster={meme.imageUrl} />
          ) : (
            <img className="meme-art" src={meme.imageUrl} alt={meme.title} loading="lazy" />
          )}
        </Link>
        <div className="meme-meta">
          <span className="meme-title">{meme.title}</span>
          <span>
            <span className="tier-chip" style={{ color: meme.tier.color }}>
              {meme.tier.name} · {meme.tier.rarity}
            </span>
          </span>
          <span className="meme-sub">
            <span>
              👁️ {(meme.views ?? meme.reshares).toLocaleString()} · 🔁{' '}
              {(meme.reshareCount ?? 0).toLocaleString()}
            </span>
            <span>🧠 {meme.value.toLocaleString()}</span>
          </span>
          {meme.listing && meme.listing.shares > 0 && (
            <span className="meme-sub">
              <span className="badge">for sale</span>
              <span>
                {meme.listing.shares} sh @ 🧠{meme.listing.pricePerShare}
              </span>
            </span>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}
