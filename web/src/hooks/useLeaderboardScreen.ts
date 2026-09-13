import { useProjectedActor } from './useProjectedActor'
import { useAuth } from './useAuth'
import { leaderboardCopy } from '../copy/leaderboard'
import { apiFetch } from '../lib/api'
import type { LeaderRow } from '../lib/types'
import { leaderboardMachine, type LeaderboardPhase } from '../stores/leaderboardMachine'
import { useMountEffect } from './useMountEffect'
import type { ButtonHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'

export type { LeaderboardPhase }

export interface LeaderboardScreenModel {
  phase: LeaderboardPhase
  subtitle: string
  podiumTitle: string
  podiumSubtitle: string
  columnHeaders: { player: string; braincells: string }
  leaders: readonly LeaderboardRowModel[]
  /** Signed-in player pinned below the visible page. */
  youRow: LeaderboardRowModel | null
  showMore: boolean
  showMoreLabel: string
  showMoreButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  showLoading: boolean
  loadingMessage: string
  showEmpty: boolean
  emptyMessage: string
  showError: boolean
  errorMessage: string
  retryLabel: string
  retry: () => void
  showList: boolean
  listSummary: string
  youLabel: string
}

export interface LeaderboardRowModel {
  sub: string
  name: string
  isMe: boolean
  /** `<Avatar>` draws the monogram fallback itself whenever there is no picture. */
  avatarSrc: string | null
  rankNumeral: string
  medalLabel: string
  linkLabel: string
  collectionLabel: string
  portfolioLabel: string
  braincellsLabel: string
  profileLinkProps: Pick<LinkProps, 'to'>
}

const copy = leaderboardCopy

/** The whole row as one utterance, so the emoji columns can stay decorative. */
function rowLabel(leader: LeaderRow, rank: number, isMe: boolean): string {
  const label = copy.row.label(rank, leader.name, leader.braincells)
  return isMe ? copy.row.youLabel(label) : label
}

export function buildLeaderboardRowModel(
  leader: LeaderRow,
  index: number,
  meSub: string | null = null,
): LeaderboardRowModel {
  const isMe = leader.sub === meSub
  return {
    sub: leader.sub,
    name: leader.name,
    isMe,
    avatarSrc: leader.picture,
    rankNumeral: `${index + 1}`,
    medalLabel: copy.row.medals[index] ?? '',
    linkLabel: rowLabel(leader, index + 1, isMe),
    collectionLabel: copy.row.collection(leader.collectionSize),
    portfolioLabel: copy.row.portfolio(leader.portfolioValue),
    braincellsLabel: copy.row.braincells(leader.braincells),
    profileLinkProps: { to: `/u/${encodeURIComponent(leader.sub)}` },
  }
}

/** Everything `LeaderboardScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLeaderboardScreen(): LeaderboardScreenModel {
  const [snapshot, send] = useProjectedActor(leaderboardMachine)
  const { user } = useAuth()
  const ctx = snapshot.context
  const phase = snapshot.value as LeaderboardPhase
  const meSub = user?.sub ?? null

  const load = () => {
    apiFetch<{ leaders: LeaderRow[] }>('/api/leaderboard')
      .then((r) => send({ type: 'DONE', leaders: r.leaders }))
      .catch(() => send({ type: 'FAIL', err: copy.loadError }))
  }

  useMountEffect(() => {
    load()
  })

  const ranked = ctx.leaders.map((leader, index) => buildLeaderboardRowModel(leader, index, meSub))
  const leaders = ranked.slice(0, ctx.visibleLimit)
  const hidden = ranked.length - leaders.length
  // the pinned row is only worth a line when the reader cannot already see themselves
  const youRow = ranked.slice(ctx.visibleLimit).find((row) => row.isMe) ?? null

  return {
    phase,
    subtitle: copy.subtitle,
    podiumTitle: copy.podium.title,
    podiumSubtitle: copy.podium.subtitle,
    columnHeaders: { player: copy.columns.player, braincells: copy.columns.braincells },
    leaders,
    youRow,
    showMore: hidden > 0,
    showMoreLabel: copy.showMore,
    showMoreButtonProps: { onClick: () => send({ type: 'SHOW_MORE' }) },
    showLoading: phase === 'loading',
    loadingMessage: copy.loading,
    showEmpty: phase === 'empty',
    emptyMessage: copy.empty,
    showError: phase === 'error',
    errorMessage: ctx.err ?? copy.loadError,
    retryLabel: copy.retry,
    retry: () => {
      send({ type: 'RETRY' })
      load()
    },
    showList: phase === 'ready',
    listSummary: copy.listSummary(ranked.length),
    youLabel: copy.row.you,
  }
}
