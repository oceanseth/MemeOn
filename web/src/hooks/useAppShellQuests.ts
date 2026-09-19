import { useCallback } from 'react'
import { apiFetch, post } from '../lib/api'
import type { Meme, QuestStep } from '../lib/types'
import type { AppShellEvent } from '../stores/appShellMachine'

export interface UseAppShellQuestsArgs {
  send: (event: AppShellEvent) => void
  refresh: () => void | Promise<void>
}

export function loadAppShellSteps(
  send: (event: AppShellEvent) => void,
  live: () => boolean,
): void {
  if (!live()) return
  void apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
    .then((r) => { if (live()) send({ type: 'SET_STEPS', steps: r.steps }) })
    // steps stay null → quest bar stays hidden
    .catch(() => {})
}

/** Quest IO: GET /api/onboarding, claim-pack, dismiss. The composer owns the live flag. */
export function useAppShellQuests({ send, refresh }: UseAppShellQuestsArgs) {
  const loadSteps = useCallback(
    (live: () => boolean) => loadAppShellSteps(send, live),
    [send],
  )

  const onClaimPack = useCallback(async () => {
    send({ type: 'CLAIM_START' })
    try {
      const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
      send({ type: 'CLAIM_DONE', memes: out.memes, reward: out.reward })
      void refresh()
    } catch {
      send({ type: 'CLAIM_FAIL' })
    }
  }, [refresh, send])

  const onDismissPack = useCallback(() => send({ type: 'DISMISS_PACK' }), [send])
  const onDismissQuests = useCallback(() => send({ type: 'DISMISS_QUESTS' }), [send])

  return { loadSteps, onClaimPack, onDismissPack, onDismissQuests }
}
