import { useProjectedActor } from './useProjectedActor'
import { binderCopy } from '../copy/binder'
import { apiFetch } from '../lib/api'
import type { Meme } from '../lib/types'
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

const copy = binderCopy

/** How the active sort reads in the status line: plain words, never the chip's emoji. */
const SORT_STATUS: Record<SortKey, readonly [descending: string, ascending: string]> = copy.status.sort

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
          err: error instanceof Error ? error.message : copy.machine.unavailable,
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
    ? copy.status.loading
    : showError
      ? copy.status.failed
      : [
          showEmpty
            ? copy.status.empty
            : hidden > 0
              ? copy.status.shownOf(visible.length, matching.length)
              : copy.status.shown(visible.length),
          SORT_STATUS[ctx.sortKey][ctx.sortDir === 'desc' ? 0 : 1],
          showGrid ? copy.status.value(visibleValue) : null,
          ctx.showPrivate && privateCount > 0 ? copy.status.privateIncluded : null,
        ]
          .filter(Boolean)
          .join(copy.separator)

  const emptyMessage = firstRun ? copy.emptyState.firstRun : copy.emptyState.allPrivate(privateCount)

  return {
    phase,
    intro: copy.intro,
    identity: user
      ? {
          name: user.name,
          pictureUrl: user.picture,
          statsLabel: copy.identity.stats(visible.length, heldShares),
        }
      : null,
    statusProps: { role: 'status', 'aria-live': 'polite' },
    statusMessage,
    collectionHeading: copy.collection.heading,
    showPrivateToggle: privateCount > 0,
    privateCount,
    privateToggleLabel: copy.collection.showPrivate(privateCount),
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
    createLabel: copy.collection.mint,
    cards: visible.map((meme) => {
      const memeCard = buildMemeCardModel(meme)
      const shares = meme.myShares ?? 0
      const sharesLabel = copy.card.shares(shares)
      return {
        id: meme.id,
        memeCard,
        ariaLabel: [
          meme.title,
          memeCard.tierLabel,
          sharesLabel,
          meme.isCreator ? copy.card.minted : null,
          meme.private ? copy.card.private : null,
        ]
          .filter(Boolean)
          .join(copy.separator),
        sharesLabel,
        sharesPct: Math.max(0, Math.min(100, shares)),
        showCreator: !!meme.isCreator,
        showPrivate: !!meme.private,
      }
    }),
    showMore:
      showGrid && hidden > 0
        ? {
            label: copy.collection.showMore(Math.min(hidden, BINDER_PAGE_SIZE)),
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
            label: copy.emptyState.mintFirst,
            linkProps: { to: '/binder/new' },
          }
        : {
            kind: 'showPrivate',
            label: copy.collection.showPrivate(privateCount),
            onClick: () => setShowPrivate(true),
          },
    showError,
    errorTitle: copy.errorState.title,
    errorMessage: copy.errorState.message,
    retryProps: {
      onClick: () => {
        send({ type: 'RETRY' })
        load()
      },
    },
    showGrid,
  }
}
