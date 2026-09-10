import { useProjectedActor } from './useProjectedActor'
import { useAuth } from './useAuth'
import { apiFetch } from '../lib/api'
import type { LeaderRow } from '../lib/types'
import { leaderboardMachine, type LeaderboardPhase } from '../stores/leaderboardMachine'
import { useMountEffect } from './useMountEffect'
import type { LinkProps } from 'react-router-dom'

export type { LeaderboardPhase }

export interface LeaderboardScreenModel {
  phase: LeaderboardPhase
  subtitle: string
  columnHeaders: { player: string; braincells: string }
  leaders: readonly LeaderboardRowModel[]
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

const medals = ['🥇', '🥈', '🥉']

const LOAD_ERROR = "Couldn't load Top Brains."

function braincells(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'braincell' : 'braincells'}`
}

/** The whole row as one utterance, so the emoji columns can stay decorative. */
function rowLabel(leader: LeaderRow, rank: number, isMe: boolean): string {
  const label = `Rank ${rank}, ${leader.name}, ${braincells(leader.braincells)}`
  return isMe ? `You, ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label
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
    medalLabel: medals[index] ?? '',
    linkLabel: rowLabel(leader, index + 1, isMe),
    collectionLabel: `📚 ${leader.collectionSize} ${leader.collectionSize === 1 ? 'meme' : 'memes'}`,
    portfolioLabel: `portfolio 🧠 ${leader.portfolioValue.toLocaleString()}`,
    braincellsLabel: `🧠 ${leader.braincells.toLocaleString()}`,
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
      .catch(() => send({ type: 'FAIL', err: LOAD_ERROR }))
  }

  useMountEffect(() => {
    load()
  })

  const leaders = ctx.leaders.map((leader, index) => buildLeaderboardRowModel(leader, index, meSub))

  return {
    phase,
    subtitle: 'The wrinkliest braincell holders on MemeOn',
    columnHeaders: { player: 'Player', braincells: 'Braincells' },
    leaders,
    showLoading: phase === 'loading',
    loadingMessage: 'Loading Top Brains…',
    showEmpty: phase === 'empty',
    emptyMessage: "Nobody's earned a braincell yet. The throne is empty.",
    showError: phase === 'error',
    errorMessage: ctx.err ?? LOAD_ERROR,
    retryLabel: 'Try again',
    retry: () => {
      send({ type: 'RETRY' })
      load()
    },
    showList: phase === 'ready',
    listSummary: `${leaders.length} ${leaders.length === 1 ? 'brain' : 'brains'} on the board`,
    youLabel: 'you',
  }
}
