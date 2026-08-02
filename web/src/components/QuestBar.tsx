import { useEffect, useState } from 'react'
import { QuestBar as QuestBarView, type PackResult } from '@memeon/ui'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { QuestStep } from '../lib/types'

/** Container: loads onboarding steps and claims the starter pack. */
export function QuestBar() {
  const { user, refresh } = useAuth()
  const [steps, setSteps] = useState<QuestStep[] | null>(null)
  const [pack, setPack] = useState<PackResult | null>(null)
  const [busy, setBusy] = useState(false)

  const allDone =
    user &&
    user.onboarding &&
    ['pack', 'mint', 'share', 'friend', 'trade'].every(
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
      const out = await post<{ memes: PackResult['memes']; reward: number }>(
        '/api/onboarding/claim-pack',
        {},
      )
      setPack({ memes: out.memes, reward: out.reward })
      setSteps((prev) => prev?.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)) ?? null)
      void refresh()
    } catch {
      /* already claimed */
    } finally {
      setBusy(false)
    }
  }

  return (
    <QuestBarView
      steps={steps}
      busy={busy}
      packResult={pack}
      onClaimPack={() => void claimPack()}
      onDismissPack={() => setPack(null)}
    />
  )
}
