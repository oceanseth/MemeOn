import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { QuestBarModel } from '../lib/questBarModel'

/** One path, changed once when the asset lands under public/brand/. */
const BRAINCELL_SRC = '/api/brand/braincell.png'

/**
 * Onboarding quest strip. Parent owns steps, pack dialog, and claim.
 * Collapsed to the next step by default; the parent owns expanded/dismissed.
 */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  return (
    <>
      {model.showSteps && (
        <div className="questbar">
          <div className={`questbar-inner${model.expanded ? ' expanded' : ''}`}>
            <span className="questbar-title">
              <img className="braincell-img" src={BRAINCELL_SRC} alt="" />{' '}
              <span className="questbar-words">Earn your braincells ·</span>{' '}
              <span className="questbar-count">{model.completionLabel}</span>
            </span>
            {model.chips.map((chip) => {
              if (chip.kind === 'claim') {
                return (
                  <button key={chip.key} className="primary quest-chip-btn" {...chip.buttonProps}>
                    🎁 {chip.label}
                  </button>
                )
              }
              const content = (
                <span key={chip.key} className={`quest-chip ${chip.done ? 'done' : ''}`}>
                  <span aria-hidden="true">{chip.done ? '✅' : '⬜'}</span>
                  <span className="sr-only">{chip.statusLabel} </span>{' '}
                  {chip.title} <em aria-hidden="true">{chip.rewardLabel}</em>
                  <span className="sr-only">, {chip.rewardAriaLabel}</span>
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
            {model.hint && <small className="quest-hint">{model.hint}</small>}
            {model.errorMessage && (
              <span className="questbar-error" {...model.errorProps}>
                {model.errorMessage}
              </span>
            )}
            {model.toggleProps && (
              <button className="quest-chip-btn quest-more" {...model.toggleProps}>
                {model.toggleLabel} <span aria-hidden="true">{model.expanded ? '▴' : '▾'}</span>
              </button>
            )}
            <button className="quest-chip-btn quest-later" {...model.dismissProps}>
              {model.dismissLabel}
            </button>
          </div>
        </div>
      )}

      {model.pack && (
        <dialog className="pack-modal" {...model.pack.dialogProps}>
          <div className="dialog-head">
            <h3 id={model.pack.titleId}>
              <img className="braincell-img" src={BRAINCELL_SRC} alt="" /> 🎁 Starter pack opened!
            </h3>
          </div>
          <button className="modal-close" {...model.pack.closeButtonProps}>
            ×
          </button>
          <p className="muted">{model.pack.description}</p>
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
            <Link className="btn primary" {...model.pack.binderLinkProps}>
              View in My Binder
            </Link>
            <button {...model.pack.exploreButtonProps}>Keep exploring</button>
          </div>
        </dialog>
      )}
    </>
  )
}
