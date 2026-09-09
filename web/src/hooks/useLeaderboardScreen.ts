import { useProjectedActor } from './useProjectedActor'
import { apiFetch } from '../lib/api'
import type { LeaderRow } from '../lib/types'
import { leaderboardMachine, type LeaderboardPhase } from '../stores/leaderboardMachine'
import { useMountEffect } from './useMountEffect'
import type { ImgHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'

export type { LeaderboardPhase }

export interface LeaderboardScreenModel {
  phase: LeaderboardPhase
  leaders: readonly LeaderboardRowModel[]
  showLoading: boolean
  showEmpty: boolean
  emptyMessage: string
  showList: boolean
}

export interface LeaderboardRowModel {
  sub: string
  name: string
  avatarImageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> | null
  rankLabel: string
  statsLabel: string
  braincellsLabel: string
  profileLinkProps: Pick<LinkProps, 'to'>
}

const medals = ['🥇', '🥈', '🥉']

export function buildLeaderboardRowModel(leader: LeaderRow, index: number): LeaderboardRowModel {
  return {
    sub: leader.sub,
    name: leader.name,
    avatarImageProps: leader.picture ? { src: leader.picture, alt: '' } : null,
    rankLabel: medals[index] ?? `#${index + 1}`,
    statsLabel: `📚 ${leader.collectionSize} memes · portfolio 🧠 ${leader.portfolioValue.toLocaleString()}`,
    braincellsLabel: `🧠 ${leader.braincells.toLocaleString()}`,
    profileLinkProps: { to: `/u/${encodeURIComponent(leader.sub)}` },
  }
}

/** Everything `LeaderboardScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLeaderboardScreen(): LeaderboardScreenModel {
  const [snapshot, send] = useProjectedActor(leaderboardMachine)
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
    leaders: ctx.leaders.map(buildLeaderboardRowModel),
    showLoading,
    showEmpty,
    emptyMessage: showError
      ? (ctx.err ?? 'could not load leaderboard')
      : "Nobody's earned a braincell yet. The throne is empty.",
    showList: phase === 'ready',
  }
}
