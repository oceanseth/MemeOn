import { Link } from 'react-router-dom'
import { MemeCard } from './MemeCard'
import { useQuestBar } from './hooks/useQuestBar'
import type { PackResult } from './hooks/useQuestBar'
import type { QuestStep } from './types'

export type { PackResult }

/**
 * Onboarding quest strip: shown under the header until all quests are done.
 * New users start with 0 braincells and earn their bankroll here.
 *
 * Presentational — the host fetches steps, claims the pack, and decides when
 * the bar disappears. Render nothing by passing `steps={[]}`.
 *
 * Markup and styling only: progress, per-step shape and the pack modal live in
 * `useQuestBar`.
 */
export function QuestBar({
  steps,
  busy = false,
  packResult = null,
  brandImageSrc,
  onClaimPack,
  onDismissPack,
}: {
  steps: QuestStep[]
  busy?: boolean
  packResult?: PackResult | null
  /** braincell mark shown in the strip and the pack modal */
  brandImageSrc?: string
  onClaimPack: () => void
  onDismissPack: () => void
}) {
  const c = useQuestBar({ steps, busy, packResult, brandImageSrc, onClaimPack, onDismissPack })

  if (!c.visible) return null

  return (
    <>
      <div className="questbar">
        <div className="questbar-inner">
          <span className="questbar-title">
            <img className="braincell-img" {...c.brandImageProps} /> {c.progressLabel}
          </span>
          {c.items.map((item) => {
            if (item.kind === 'claim') {
              return (
                <button key={item.key} className="primary quest-chip-btn" {...item.buttonProps}>
                  🎁 {item.label}
                </button>
              )
            }
            const chip = (
              <span
                key={item.key}
                className={`quest-chip ${item.done ? 'done' : ''}`}
                title={item.hint}
              >
                {item.marker} {item.title} <em>+{item.reward}🧠</em>
              </span>
            )
            return item.linkProps ? (
              <Link key={item.key} className="quest-chip-link" {...item.linkProps}>
                {chip}
              </Link>
            ) : (
              chip
            )
          })}
        </div>
      </div>

      {c.packOpen && (
        <div className="pack-overlay" {...c.packOverlayProps}>
          <div className="pack-modal" {...c.packModalProps}>
            <img
              className="braincell-img"
              style={{ width: 64, height: 64, float: 'right' }}
              {...c.packMarkProps}
            />
            <h3>🎁 Starter pack opened!</h3>
            <p style={{ color: 'var(--text-dim)' }}>{c.packBody}</p>
            {c.packMemes.length > 0 && (
              <div
                className="card-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
              >
                {c.packMemes.map((m) => (
                  <MemeCard key={m.id} meme={m} />
                ))}
              </div>
            )}
            <div className="filter-bar" style={{ marginTop: 16 }}>
              <Link {...c.packBinderLinkProps}>
                <button className="primary" {...c.packDismissProps}>
                  View in My Binder
                </button>
              </Link>
              <button {...c.packDismissProps}>Keep exploring</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
