import type { Actor } from 'xstate'
import { appShellMachine } from '../stores/appShellMachine'
import { apiFetch, post } from './api'
import type { Meme, QuestStep } from './types'

type AppShellSend = Actor<typeof appShellMachine>['send']

export function loadOnboardingSteps({
  live,
  send,
}: {
  live: { current: boolean }
  send: AppShellSend
}): void {
  if (!live.current) return
  void apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
    .then((r) => { if (live.current) send({ type: 'SET_STEPS', steps: r.steps }) })
    // steps stay null → quest bar stays hidden
    .catch(() => {})
}

export async function claimOnboardingPack({
  send,
  refresh,
}: {
  send: AppShellSend
  refresh: () => Promise<void>
}): Promise<void> {
  send({ type: 'CLAIM_START' })
  try {
    const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
    send({ type: 'CLAIM_DONE', memes: out.memes, reward: out.reward })
    void refresh()
  } catch {
    send({ type: 'CLAIM_FAIL' })
  }
}

export function dismissPack(send: AppShellSend): void {
  send({ type: 'DISMISS_PACK' })
}

export function dismissQuests(send: AppShellSend): void {
  send({ type: 'DISMISS_QUESTS' })
}
