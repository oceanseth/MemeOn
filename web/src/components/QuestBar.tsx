import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { MemeCard } from './MemeCard'
import type { Meme, QuestStep } from '../lib/types'

/**
 * Onboarding quest strip: shown under the header until all quests are done.
 * New users start with 0 braincells and earn their bankroll here.
 */
export function QuestBar() {
  const { user, refresh } = useAuth()
  const [steps, setSteps] = useState<QuestStep[] | null>(null)
  const [packMemes, setPackMemes] = useState<Meme[] | null>(null)
  const [packReward, setPackReward] = useState(0)
  const [busy, setBusy] = useState(false)

  const allDone = user && user.onboarding && ['pack', 'mint', 'share', 'friend', 'trade'].every(
    (k) => user.onboarding?.[k as keyof typeof user.onboarding],
  )

  useEffect(() => {
    if (!user || allDone) return
    apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
      .then((r) => setSteps(r.steps))
      .catch(() => {})
  }, [user, allDone])

  if (!user || allDone || !steps) return null

  const claimPack = async () => {
    setBusy(true)
    try {
      const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
      setPackMemes(out.memes)
      setPackReward(out.reward)
      setSteps((prev) => prev?.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)) ?? null)
      void refresh()
    } catch {
      /* already claimed */
    } finally {
      setBusy(false)
    }
  }

  const doneCount = steps.filter((s) => s.done).length

  return (
    <>
      <div className="questbar">
        <div className="questbar-inner">
          <span className="questbar-title">
            <img className="braincell-img" src="/api/brand/braincell.png" alt="braincell" /> Earn
            your braincells · {doneCount}/{steps.length}
          </span>
          {steps.map((s) =>
            s.key === 'pack' && !s.done ? (
              <button key={s.key} className="primary quest-chip-btn" onClick={claimPack} disabled={busy}>
                🎁 {busy ? 'Opening…' : `${s.title} (+${s.reward} 🧠)`}
              </button>
            ) : (
              <span key={s.key} className={`quest-chip ${s.done ? 'done' : ''}`} title={s.hint}>
                {s.done ? '✅' : '⬜'} {s.title} <em>+{s.reward}🧠</em>
              </span>
            ),
          )}
        </div>
      </div>

      {packMemes && (
        <div className="pack-overlay" onClick={() => setPackMemes(null)}>
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
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {packMemes.map((m) => (
                  <MemeCard key={m.id} meme={m} />
                ))}
              </div>
            )}
            <div className="filter-bar" style={{ marginTop: 16 }}>
              <Link to="/binder">
                <button className="primary" onClick={() => setPackMemes(null)}>
                  View in My Binder
                </button>
              </Link>
              <button onClick={() => setPackMemes(null)}>Keep exploring</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
