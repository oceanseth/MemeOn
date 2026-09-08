import { useMachine } from '@xstate/react'
import { useAuth } from './useAuth'
import { apiFetch } from '../lib/api'
import type { Meme } from '../lib/types'
import { sortMemes, type SortDir, type SortKey } from '../molecules/SortChips'
import { binderMachine, type BinderPhase } from '../stores/binderMachine'
import { useMountEffect } from './useMountEffect'

export type { BinderPhase }

export interface BinderScreenModel {
  phase: BinderPhase
  collectionLabel: string | null
  showCollection: boolean
  showPrivateToggle: boolean
  privateCount: number
  showPrivate: boolean
  sortKey: SortKey
  sortDir: SortDir
  visible: Meme[]
  showLoading: boolean
  showEmpty: boolean
  emptyMessage: string
  showGrid: boolean
  onShowPrivateChange: (show: boolean) => void
  onSortChange: (key: SortKey, dir: SortDir) => void
}

/** Everything `BinderScreen` renders. The hook is the engine; the screen is the terminal. */
export function useBinderScreen(): BinderScreenModel {
  const { user } = useAuth()
  const [snapshot, send] = useMachine(binderMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as BinderPhase

  useMountEffect(() => {
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => send({ type: 'DONE', memes: r.memes }))
      .catch(() => send({ type: 'DONE', memes: [] }))
  })

  const visible = sortMemes(
    ctx.memes.filter((m) => ctx.showPrivate || !m.private),
    ctx.sortKey,
    ctx.sortDir,
  )
  const privateCount = ctx.memes.filter((m) => m.private).length
  const showLoading = phase === 'loading'
  const showEmpty = !showLoading && visible.length === 0
  const emptyMessage =
    ctx.memes.length === 0
      ? 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.'
      : 'Everything here is private — tick "Show private" to see it.'

  return {
    phase,
    collectionLabel: user
      ? `${user.collectionSize} positions · portfolio 🧠 ${user.portfolioValue.toLocaleString()}`
      : null,
    showCollection: !!user,
    showPrivateToggle: privateCount > 0,
    privateCount,
    showPrivate: ctx.showPrivate,
    sortKey: ctx.sortKey,
    sortDir: ctx.sortDir,
    visible,
    showLoading,
    showEmpty,
    emptyMessage,
    showGrid: !showLoading && visible.length > 0,
    onShowPrivateChange: (showPrivate) => send({ type: 'SET_SHOW_PRIVATE', showPrivate }),
    onSortChange: (sortKey, sortDir) => send({ type: 'SET_SORT', sortKey, sortDir }),
  }
}
