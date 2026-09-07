import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { Meme, QuestKey, QuestStep } from '../lib/types'

/** Where each undone quest sends you to go do the thing. */
const QUEST_LINKS: Partial<Record<QuestKey, string>> = {
  mint: '/binder/new',
  share: '/binder',
  friend: '/friends',
  trade: '/marketplace',
}

/**
 * Onboarding quest strip. Parent owns steps, pack overlay, and claim.
 * Hidden when there are no steps and no pack to show.
 */
export function QuestBar({
  steps,
  packMemes,
  packReward,
  busy,
  onClaimPack,
  onDismissPack,
}: {
  steps: QuestStep[]
  packMemes: Meme[] | null
  packReward: number
  busy: boolean
  onClaimPack: () => void
  onDismissPack: () => void
}) {
  if (steps.length === 0 && !packMemes) return null

  const doneCount = steps.filter((s) => s.done).length

  return (
    <>
      {steps.length > 0 && (
        <div className="questbar">
          <div className="questbar-inner">
            <span className="questbar-title">
              <img className="braincell-img" src="/api/brand/braincell.png" alt="braincell" /> Earn
              your braincells · {doneCount}/{steps.length}
            </span>
            {steps.map((s) => {
              if (s.key === 'pack' && !s.done) {
                return (
                  <button
                    key={s.key}
                    className="primary quest-chip-btn"
                    onClick={onClaimPack}
                    disabled={busy}
                  >
                    🎁 {busy ? 'Opening…' : `${s.title} (+${s.reward} 🧠)`}
                  </button>
                )
              }
              const to = s.done ? null : QUEST_LINKS[s.key]
              const chip = (
                <span key={s.key} className={`quest-chip ${s.done ? 'done' : ''}`} title={s.hint}>
                  {s.done ? '✅' : '⬜'} {s.title} <em>+{s.reward}🧠</em>
                </span>
              )
              return to ? (
                <Link key={s.key} to={to} className="quest-chip-link" title={s.hint}>
                  {chip}
                </Link>
              ) : (
                chip
              )
            })}
          </div>
        </div>
      )}

      {packMemes && (
        <div className="pack-overlay" onClick={onDismissPack}>
          <div className="pack-modal" onClick={(e) => e.stopPropagation()}>
            <img
              className="braincell-img"
              src="/api/brand/braincell.png"
              alt=""
              style={{ width: 64, height: 64, float: 'right' }}
            />
            <h3>🎁 Starter pack opened!</h3>
            <p style={{ color: 'var(--text-dim)' }}>
              {packMemes.length > 0
                ? `You now hold 10 shares in each of these — plus ${packReward} 🧠 braincells.`
                : `The vault was empty, so you got ${packReward} 🧠 braincells instead. Spend them wisely.`}
            </p>
            {packMemes.length > 0 && (
              <div
                className="card-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
              >
                {packMemes.map((m) => (
                  <MemeCard key={m.id} meme={m} />
                ))}
              </div>
            )}
            <div className="filter-bar" style={{ marginTop: 16 }}>
              <Link to="/binder">
                <button className="primary" onClick={onDismissPack}>
                  View in My Binder
                </button>
              </Link>
              <button onClick={onDismissPack}>Keep exploring</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
