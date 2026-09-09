import { useProjectedActor } from './useProjectedActor'
import { useAuth } from './useAuth'
import { apiFetch } from '../lib/api'
import type { Meme } from '../lib/types'
import { sortMemes } from '../lib/sorting'
import { binderMachine, type BinderPhase } from '../stores/binderMachine'
import { useMountEffect } from './useMountEffect'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel, type SortChipsModel } from '../lib/sortChipsModel'
import type { InputHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'

export type { BinderPhase }

export interface BinderScreenModel {
  phase: BinderPhase
  collectionLabel: string | null
  showCollection: boolean
  showPrivateToggle: boolean
  privateCount: number
  privateToggleProps: Pick<InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'>
  sortChips: SortChipsModel
  createLinkProps: Pick<LinkProps, 'to'>
  cards: readonly BinderCardModel[]
  showLoading: boolean
  showEmpty: boolean
  emptyMessage: string
  showGrid: boolean
}

interface BinderCardModel {
  id: string
  memeCard: MemeCardModel
  sharesLabel: string
  showCreator: boolean
  showPrivate: boolean
}

/** Everything `BinderScreen` renders. The hook is the engine; the screen is the terminal. */
export function useBinderScreen(): BinderScreenModel {
  const { user } = useAuth()
  const [snapshot, send] = useProjectedActor(binderMachine)
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
    privateToggleProps: {
      checked: ctx.showPrivate,
      onChange: (event) => send({ type: 'SET_SHOW_PRIVATE', showPrivate: event.target.checked }),
    },
    sortChips: buildSortChipsModel({
      sortKey: ctx.sortKey,
      dir: ctx.sortDir,
      onChange: (sortKey, sortDir) => send({ type: 'SET_SORT', sortKey, sortDir }),
    }),
    createLinkProps: { to: '/binder/new' },
    cards: visible.map((meme) => ({
      id: meme.id,
      memeCard: buildMemeCardModel(meme),
      sharesLabel: `${meme.myShares ?? 0}/100 shares`,
      showCreator: !!meme.isCreator,
      showPrivate: !!meme.private,
    })),
    showLoading,
    showEmpty,
    emptyMessage,
    showGrid: !showLoading && visible.length > 0,
  }
}
