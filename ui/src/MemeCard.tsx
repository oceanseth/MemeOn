import { Link, MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useMemeCard } from './hooks/useMemeCard'
import { useNeedsRouter } from './hooks/useNeedsRouter'
import type { Meme } from './types'

export interface MemeCardProps {
  meme: Meme
  /** extra content under the stat line — owner actions, listing controls */
  footer?: ReactNode
}

/**
 * A meme trading card: art, title, tier chip, and the views / reshares / value
 * line. Tier drives the frame, sheen and sparkle treatments.
 *
 * Has **no intrinsic width** — render it inside `card-grid` or another
 * width-constrained parent, or the square art fills the container.
 *
 * Markup and styling only: everything else lives in `useMemeCard`.
 */
export function MemeCard(props: MemeCardProps) {
  // The card links to the meme detail route. Without a Router ancestor the
  // <Link> throws and React unmounts the subtree — a silent blank card. Supply
  // one only when the host hasn't, so a real router still owns navigation.
  if (useNeedsRouter()) {
    return (
      <MemoryRouter>
        <MemeCardView {...props} />
      </MemoryRouter>
    )
  }
  return <MemeCardView {...props} />
}

function MemeCardView({ meme, footer }: MemeCardProps) {
  const c = useMemeCard({ meme })

  return (
    <div className={`meme-card ${c.tierClass}`}>
      <div className="meme-card-inner">
        <Link {...c.linkProps}>
          {c.isVideo ? (
            <video className="meme-art" {...c.videoProps} />
          ) : (
            <img className="meme-art" loading="lazy" {...c.imageProps} />
          )}
        </Link>
        <div className="meme-meta">
          <span className="meme-title">{c.title}</span>
          <span>
            <span className="tier-chip" style={{ color: c.tierColor }}>
              {c.tierLabel}
            </span>
          </span>
          <span className="meme-sub">
            <span>
              👁️ {c.viewsLabel} · 🔁 {c.resharesLabel}
            </span>
            <span>🧠 {c.valueLabel}</span>
          </span>
          {c.listing && (
            <span className="meme-sub">
              <span className="badge">for sale</span>
              <span>{c.listingLabel}</span>
            </span>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}
