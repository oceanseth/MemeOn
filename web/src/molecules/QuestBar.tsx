import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { QuestBarModel } from '../lib/questBarModel'

/**
 * Onboarding quest strip. Parent owns steps, pack overlay, and claim.
 * Hidden when there are no steps and no pack to show.
 */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  return (
    <>
      {model.showSteps && (
        <div className="questbar">
          <div className="questbar-inner">
            <span className="questbar-title">
              <img className="braincell-img" src="/api/brand/braincell.png" alt="braincell" /> Earn
              your braincells · {model.completionLabel}
            </span>
            {model.chips.map((chip) => {
              if (chip.kind === 'claim') {
                return (
                  <button
                    key={chip.key}
                    className="primary quest-chip-btn"
                    {...chip.buttonProps}
                  >
                    🎁 {chip.label}
                  </button>
                )
              }
              const content = (
                <span key={chip.key} className={`quest-chip ${chip.done ? 'done' : ''}`} {...chip.chipProps}>
                  {chip.done ? '✅' : '⬜'} {chip.title} <em>{chip.rewardLabel}</em>
                </span>
              )
              return chip.linkProps ? (
                <Link key={chip.key} {...chip.linkProps} className="quest-chip-link">
                  {content}
                </Link>
              ) : (
                content
              )
            })}
          </div>
        </div>
      )}

      {model.pack && (
        <div className="pack-overlay" {...model.pack.overlayProps}>
          <div className="pack-modal" {...model.pack.modalProps}>
            <img
              className="braincell-img"
              src="/api/brand/braincell.png"
              alt=""
              style={{ width: 64, height: 64, float: 'right' }}
            />
            <h3>🎁 Starter pack opened!</h3>
            <p style={{ color: 'var(--text-dim)' }}>
              {model.pack.description}
            </p>
            {model.pack.showCards && (
              <div
                className="card-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
              >
                {model.pack.cards.map((card) => (
                  <MemeCard key={card.id} model={card} />
                ))}
              </div>
            )}
            <div className="filter-bar" style={{ marginTop: 16 }}>
              <Link {...model.pack.binderLinkProps}>
                <button className="primary" {...model.pack.binderButtonProps}>
                  View in My Binder
                </button>
              </Link>
              <button {...model.pack.exploreButtonProps}>Keep exploring</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
