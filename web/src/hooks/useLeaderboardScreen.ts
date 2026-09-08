import { useMachine } from '@xstate/react'
import { apiFetch } from '../lib/api'
import type { LeaderRow } from '../lib/types'
import { leaderboardMachine, type LeaderboardPhase } from '../stores/leaderboardMachine'
import { useMountEffect } from './useMountEffect'

export type { LeaderboardPhase }

export interface LeaderboardScreenModel {
  phase: LeaderboardPhase
  leaders: LeaderRow[]
  showLoading: boolean
  showEmpty: boolean
  emptyMessage: string
  showList: boolean
}

/** Everything `LeaderboardScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLeaderboardScreen(): LeaderboardScreenModel {
  const [snapshot, send] = useMachine(leaderboardMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as LeaderboardPhase

  useMountEffect(() => {
    apiFetch<{ leaders: LeaderRow[] }>('/api/leaderboard')
      .then((r) => send({ type: 'DONE', leaders: r.leaders }))
      .catch(() => send({ type: 'DONE', leaders: [] }))
  })

  const showLoading = phase === 'loading'
  const showError = phase === 'error'
  const showEmpty = phase === 'empty' || showError

  return {
    phase,
    leaders: ctx.leaders,
    showLoading,
    showEmpty,
    emptyMessage: showError
      ? (ctx.err ?? 'could not load leaderboard')
      : "Nobody's earned a braincell yet. The throne is empty.",
    showList: phase === 'ready',
  }
}
