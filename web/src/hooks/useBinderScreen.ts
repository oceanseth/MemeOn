import { useProjectedActor } from './useProjectedActor'
import { apiFetch } from '../lib/api'
import type { Meme } from '../lib/types'
import { plural } from '../lib/plural'
import { sortMemes, type SortDir, type SortKey } from '../lib/sorting'
import { binderMachine, BINDER_PAGE_SIZE, type BinderPhase } from '../stores/binderMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel, type SortChipsModel } from '../lib/sortChipsModel'
import type { CheckboxRootProps } from '@base-ui/react/checkbox'
import { useCallback } from 'react'
import { useSearchParams, type LinkProps } from 'react-router-dom'

export type { BinderPhase }

/** The one action an empty binder offers, in place, instead of pointing at a control elsewhere. */
export type BinderEmptyAction =
  | { kind: 'create'; label: string; linkProps: Pick<LinkProps, 'to'> }
  | { kind: 'showPrivate'; label: string; onClick: () => void }

/** The binder's own identity line: whose cards these are, and how much of them is held. */
export interface BinderIdentityModel {
  name: string
  pictureUrl: string | null
  /** "6 cards · 72 shares" — counted from the memes the grid is rendering */
  statsLabel: string
}

export interface BinderScreenModel {
  phase: BinderPhase
  /** the page's introduction, under the title */
  intro: string
  identity: BinderIdentityModel | null
  /** Persistent live region: mounted in every state, its text swapped, the way Marketplace does it. */
  statusProps: { role: 'status'; 'aria-live': 'polite' }
  /** Counted result line: what the grid is showing right now, and why. */
  statusMessage: string
  collectionHeading: string
  showPrivateToggle: boolean
  privateCount: number
  privateToggleLabel: string
  privateToggleProps: Pick<CheckboxRootProps, 'checked' | 'onCheckedChange'>
  sortChips: SortChipsModel
  createLinkProps: Pick<LinkProps, 'to'>
  createLabel: string
  cards: readonly BinderCardModel[]
  /** the centred "Show N more" control under the grid; null once every card is on screen */
  showMore: { label: string; onClick: () => void } | null
  showLoading: boolean
  showEmpty: boolean
  emptyMessage: string
  emptyAction: BinderEmptyAction | null
  showError: boolean
  errorTitle: string
  errorMessage: string
  retryProps: { onClick: () => void }
  showGrid: boolean
}

interface BinderCardModel {
  id: string
  memeCard: MemeCardModel
  /** the whole card announced as one unit, so the grid is not a run of orphan numbers */
  ariaLabel: string
  sharesLabel: string
  /** 0–100: shares held of the meme's 100, drawn as the ownership fill */
  sharesPct: number
  showCreator: boolean
  showPrivate: boolean
}

/** How the active sort reads in the status line: plain words, never the chip's emoji. */
const SORT_STATUS: Record<SortKey, readonly [descending: string, ascending: string]> = {
  new: ['newest first', 'oldest first'],
  views: ['most views first', 'fewest views first'],
  reshares: ['most reshares first', 'fewest reshares first'],
  value: ['highest value first', 'lowest value first'],
}

const SORT_KEYS: readonly string[] = ['new', 'views', 'reshares', 'value']
const isSortKey = (value: string | null): value is SortKey =>
  value !== null && SORT_KEYS.includes(value)

/** Everything `BinderScreen` renders. The hook is the engine; the screen is the terminal. */
export function useBinderScreen(): BinderScreenModel {
  const [snapshot, send] = useProjectedActor(binderMachine)
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const ctx = snapshot.context
  const phase = snapshot.value as BinderPhase

  const load = useCallback(() => {
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((result) => send({ type: 'DONE', memes: result.memes }))
      .catch((error: unknown) =>
        send({
          type: 'FAIL',
          err: error instanceof Error ? error.message : 'binder unavailable',
        }),
      )
  }, [send])

  useMountEffect(() => {
    // The URL is the shareable seed; the machine stays the single source of truth for render.
    const sortKey = params.get('sort')
    if (isSortKey(sortKey)) {
      send({ type: 'SET_SORT', sortKey, sortDir: params.get('dir') === 'asc' ? 'asc' : 'desc' })
    }
    if (params.get('private') === '1') send({ type: 'SET_SHOW_PRIVATE', showPrivate: true })
    load()
  })

  const writeUrl = (next: { sortKey: SortKey; sortDir: SortDir; showPrivate: boolean }): void => {
    const out = new URLSearchParams(params)
    if (next.sortKey === 'new') out.delete('sort')
    else out.set('sort', next.sortKey)
    if (next.sortDir === 'desc') out.delete('dir')
    else out.set('dir', next.sortDir)
    if (next.showPrivate) out.set('private', '1')
    else out.delete('private')
    setParams(out, { replace: true })
  }

  const setShowPrivate = (showPrivate: boolean): void => {
    send({ type: 'SET_SHOW_PRIVATE', showPrivate })
    writeUrl({ sortKey: ctx.sortKey, sortDir: ctx.sortDir, showPrivate })
  }

  const matching = sortMemes(
    ctx.memes.filter((m) => ctx.showPrivate || !m.private),
    ctx.sortKey,
    ctx.sortDir,
  )
  const visible = matching.slice(0, ctx.visibleLimit)
  const hidden = matching.length - visible.length
  const privateCount = ctx.memes.filter((m) => m.private).length
  const showLoading = phase === 'loading'
  const showError = phase === 'error'
  const showEmpty = !showLoading && !showError && matching.length === 0
  const showGrid = !showLoading && !showError && matching.length > 0
  const firstRun = ctx.memes.length === 0

  // Both the count and the 🧠 total come from the memes the grid is rendering, never from a
  // second source that can disagree with what is on screen.
  const visibleValue = visible.reduce((total, meme) => total + meme.value, 0)
  const heldShares = visible.reduce((total, meme) => total + (meme.myShares ?? 0), 0)

  // one status line for the whole screen: the count is the live region, and the error box owns
  // the error copy — so a sort, a private-toggle or a state swap is never silent
  const statusMessage = showLoading
    ? 'Loading your binder…'
    : showError
      ? 'No cards loaded'
      : [
          showEmpty
            ? 'No cards shown'
            : hidden > 0
              ? `${visible.length} of ${plural(matching.length, 'card')} shown`
              : `${plural(visible.length, 'card')} shown`,
          SORT_STATUS[ctx.sortKey][ctx.sortDir === 'desc' ? 0 : 1],
          showGrid ? `🧠 ${visibleValue.toLocaleString()}` : null,
          ctx.showPrivate && privateCount > 0 ? 'private included' : null,
        ]
          .filter(Boolean)
          .join(' · ')

  const emptyMessage = firstRun
    ? 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.'
    : `All ${privateCount} of your memes are private. Turn on "Show private" to see them.`

  return {
    phase,
    intro: 'Your corner of the internet. In card form.',
    identity: user
      ? {
          name: user.name,
          pictureUrl: user.picture,
          statsLabel: `${plural(visible.length, 'card')} · ${plural(heldShares, 'share')}`,
        }
      : null,
    statusProps: { role: 'status', 'aria-live': 'polite' },
    statusMessage,
    collectionHeading: 'Your collection',
    showPrivateToggle: privateCount > 0,
    privateCount,
    privateToggleLabel: `Show private (${privateCount})`,
    privateToggleProps: {
      checked: ctx.showPrivate,
      onCheckedChange: (checked) => setShowPrivate(checked),
    },
    sortChips: buildSortChipsModel({
      sortKey: ctx.sortKey,
      dir: ctx.sortDir,
      onChange: (sortKey, sortDir) => {
        send({ type: 'SET_SORT', sortKey, sortDir })
        writeUrl({ sortKey, sortDir, showPrivate: ctx.showPrivate })
      },
    }),
    createLinkProps: { to: '/binder/new' },
    createLabel: 'Mint a meme',
    cards: visible.map((meme) => {
      const memeCard = buildMemeCardModel(meme)
      const shares = meme.myShares ?? 0
      const sharesLabel = `${shares}/100 shares`
      return {
        id: meme.id,
        memeCard,
        ariaLabel: [
          meme.title,
          memeCard.tierLabel,
          sharesLabel,
          meme.isCreator ? 'you minted this' : null,
          meme.private ? 'private' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        sharesLabel,
        sharesPct: Math.max(0, Math.min(100, shares)),
        showCreator: !!meme.isCreator,
        showPrivate: !!meme.private,
      }
    }),
    showMore:
      showGrid && hidden > 0
        ? {
            label: `Show ${Math.min(hidden, BINDER_PAGE_SIZE)} more`,
            onClick: () => send({ type: 'SHOW_MORE' }),
          }
        : null,
    showLoading,
    showEmpty,
    emptyMessage,
    emptyAction: !showEmpty
      ? null
      : firstRun
        ? {
            kind: 'create',
            label: '＋ Mint your first meme',
            linkProps: { to: '/binder/new' },
          }
        : {
            kind: 'showPrivate',
            label: `Show private (${privateCount})`,
            onClick: () => setShowPrivate(true),
          },
    showError,
    errorTitle: "Couldn't load your binder.",
    errorMessage: 'Your cards are safe — nothing was lost. Give it another go.',
    retryProps: {
      onClick: () => {
        send({ type: 'RETRY' })
        load()
      },
    },
    showGrid,
  }
}
