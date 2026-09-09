import { useProjectedActor } from './useProjectedActor'
import { useCallback, useMemo, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TIERS } from '../../../shared/tiers'
import { apiFetch } from '../lib/api'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel, type SortChipsModel } from '../lib/sortChipsModel'
import type { SortDir, SortKey } from '../lib/sorting'
import type { Meme } from '../lib/types'
import {
  marketplaceMachine,
  type MarketplaceContext,
  type MarketplaceInput,
  type MarketplacePhase,
} from '../stores/marketplaceMachine'
import { useMountEffect } from './useMountEffect'

const PAGE = 60
const SKELETON_COUNT = 8
const FILTERS_PANEL_ID = 'market-filters'

/**
 * `GET /api/memes` pages the catalogue newest-first and takes no sort key, so ranking by a stat
 * would only reorder the pages already loaded. The chips stay visible and inert until the API can
 * rank, rather than presenting a sample as the leaderboard of the whole market.
 */
const SORT_DISABLED_REASON = "Newest first — the market can't rank by views, reshares or value yet."
const LOAD_ERROR = "Couldn't reach the market. Your filters are still set."
const MORE_ERROR = "Couldn't pull the next page."

export interface MarketplaceScreenModel {
  phase: MarketplacePhase
  cards: readonly MemeCardModel[]
  queryInputProps: {
    value: string
    placeholder: string
    'aria-label': string
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  typeSelectProps: {
    value: string
    'aria-label': string
    onChange: ChangeEventHandler<HTMLSelectElement>
  }
  tierSelectProps: {
    value: string
    'aria-label': string
    onChange: ChangeEventHandler<HTMLSelectElement>
  }
  listedInputProps: { checked: boolean; onChange: ChangeEventHandler<HTMLInputElement> }
  sortChips: SortChipsModel
  createLinkProps: { to: string }
  filtersToggleProps: {
    onClick: () => void
    'aria-expanded': boolean
    'aria-controls': string
  }
  filtersToggleLabel: string
  filtersPanelProps: { id: string; 'data-collapsed': 'true' | 'false' }
  statusProps: { role: 'status'; 'aria-live': 'polite' }
  resultsLabel: string
  clearFiltersProps: { onClick: () => void } | null
  showLoading: boolean
  showEmpty: boolean
  showError: boolean
  showGrid: boolean
  showMore: boolean
  skeletonCount: number
  errorMessage: string
  retryButtonProps: { onClick: () => void; disabled: boolean }
  retryLabel: string
  loadMoreProps: { onClick: () => void; disabled: boolean; 'aria-busy': boolean }
  loadMoreLabel: string
  loadMoreError: string | null
  endOfListLabel: string | null
  sentinelRef?: RefCallback<HTMLDivElement> | undefined
}

function queryString(ctx: { q: string; type: string; tier: string; listed: boolean }): string {
  const params = new URLSearchParams()
  if (ctx.q) params.set('q', ctx.q)
  if (ctx.type) params.set('type', ctx.type)
  if (ctx.tier) params.set('tier', ctx.tier)
  if (ctx.listed) params.set('listed', 'true')
  params.set('limit', String(PAGE))
  return params.toString()
}

const isSortKey = (value: string | null): value is SortKey =>
  value === 'new' || value === 'views' || value === 'reshares' || value === 'value'

const isSortDir = (value: string | null): value is SortDir => value === 'asc' || value === 'desc'

/** The shareable half of the market: everything a link has to carry to reopen the same shelf. */
function filtersFromUrl(params: URLSearchParams): MarketplaceInput {
  const sortKey = params.get('sort')
  const sortDir = params.get('dir')
  return {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    tier: params.get('tier') ?? '',
    listed: params.get('listed') === 'true',
    ...(isSortKey(sortKey) ? { sortKey } : {}),
    ...(isSortDir(sortDir) ? { sortDir } : {}),
  }
}

function writeFilter(params: URLSearchParams, key: string, value: string, fallback = ''): void {
  if (value === fallback) params.delete(key)
  else params.set(key, value)
}

const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? '' : 's'}`

const typeLabel = (type: string): string => (type === 'video' ? 'Videos' : 'Images')

const tierLabel = (tier: string): string =>
  TIERS.find((candidate) => candidate.key === tier)?.name ?? tier

function activeFilterLabels(ctx: MarketplaceContext): string[] {
  const labels: string[] = []
  if (ctx.q) labels.push(`“${ctx.q}”`)
  if (ctx.type) labels.push(typeLabel(ctx.type))
  if (ctx.tier) labels.push(tierLabel(ctx.tier))
  if (ctx.listed) labels.push('for sale')
  return labels
}

/** Marketplace query, cursor continuation, filter decoding, and card models. */
export function useMarketplaceScreen(): MarketplaceScreenModel {
  const [params, setParams] = useSearchParams()
  const filtersRef = useRef<MarketplaceInput | null>(null)
  const initialFilters = (filtersRef.current ??= filtersFromUrl(params))
  const [snapshot, send, actor] = useProjectedActor(marketplaceMachine, { input: initialFilters })
  const loadingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const context = snapshot.context
  const phase = snapshot.value as MarketplacePhase

  const fetchFromStart = useCallback(() => {
    const live = actor.getSnapshot().context
    loadingRef.current = true
    send({ type: 'FETCHING', scope: 'refresh' })
    apiFetch<{ memes: Meme[]; nextCursor: string | null }>(`/api/memes?${queryString(live)}`)
      .then((result) => send({ type: 'LOADED', memes: result.memes, nextCursor: result.nextCursor }))
      .catch(() => send({ type: 'FAIL', err: 'load failed' }))
      .finally(() => { loadingRef.current = false })
  }, [actor, send])

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fetchFromStart, 250)
  }, [fetchFromStart])

  /** The observer keeps firing while the sentinel is in view, so a failed page waits to be retried. */
  const loadMore = useCallback(async (manual = false) => {
    const live = actor.getSnapshot().context
    if (loadingRef.current || !live.nextCursor) return
    if (live.moreErr && !manual) return
    loadingRef.current = true
    send({ type: 'FETCHING', scope: 'more' })
    try {
      const result = await apiFetch<{ memes: Meme[]; nextCursor: string | null }>(
        `/api/memes?${queryString(live)}&cursor=${encodeURIComponent(live.nextCursor)}`,
      )
      send({ type: 'APPEND', memes: result.memes, nextCursor: result.nextCursor })
    } catch {
      send({ type: 'MORE_FAILED', err: 'append failed' })
    } finally {
      loadingRef.current = false
    }
  }, [actor, send])

  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore
  // Callback freshness comes from loadMoreRef.current, but the cursor dependency is load-bearing:
  // re-observing after each page re-delivers the intersection while the sentinel is still on
  // screen, which is how a sparse or duplicate-only page is crossed without a scroll.
  const sentinelRef = useCallback<RefCallback<HTMLDivElement>>((element) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMoreRef.current()
    }, { rootMargin: '900px' })
    observer.observe(element)
    observerRef.current = observer
  }, [context.nextCursor])

  useMountEffect(() => {
    scheduleFetch()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      observerRef.current?.disconnect()
    }
  })

  /** Filters live in the URL so the market can be linked, reloaded and returned to with Back. */
  const syncUrl = useCallback(() => {
    const live = actor.getSnapshot().context
    setParams((current) => {
      const next = new URLSearchParams(current)
      writeFilter(next, 'q', live.q)
      writeFilter(next, 'type', live.type)
      writeFilter(next, 'tier', live.tier)
      writeFilter(next, 'listed', live.listed ? 'true' : '')
      writeFilter(next, 'sort', live.sortKey, 'new')
      writeFilter(next, 'dir', live.sortDir, 'desc')
      return next
    }, { replace: true })
  }, [actor, setParams])

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    send({ type: 'SET_Q', q: event.target.value })
    syncUrl()
    scheduleFetch()
  }
  const onTypeChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    send({ type: 'SET_TYPE', value: event.target.value })
    syncUrl()
    scheduleFetch()
  }
  const onTierChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    send({ type: 'SET_TIER', value: event.target.value })
    syncUrl()
    scheduleFetch()
  }
  const onListedChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    send({ type: 'SET_LISTED', listed: event.target.checked })
    syncUrl()
    scheduleFetch()
  }
  const onClearFilters = () => {
    send({ type: 'CLEAR_FILTERS' })
    syncUrl()
    scheduleFetch()
  }

  const cards = useMemo(() => context.memes.map(buildMemeCardModel), [context.memes])

  const showLoading = phase === 'loading'
  const showEmpty = phase === 'empty'
  const showError = phase === 'error'
  const showGrid = phase === 'ready'
  const showMore = showGrid && !!context.nextCursor
  const refreshing = context.busy === 'refresh'
  const filterLabels = activeFilterLabels(context)
  const narrowed = filterLabels.length > 0
  const countLabel = context.nextCursor
    ? `${plural(cards.length, 'meme')} so far`
    : plural(cards.length, 'meme')
  // one status line: the count doubles as the live region, and the alert box owns the error copy
  const resultsLabel = showLoading || refreshing
    ? 'Searching the market…'
    : [showError ? 'No memes loaded' : showEmpty ? 'Nothing matches' : countLabel, ...filterLabels]
      .join(' · ')
  const hiddenFilterCount = [context.type, context.tier, context.listed ? 'listed' : ''].filter(
    Boolean,
  ).length

  return {
    phase,
    cards,
    queryInputProps: {
      value: context.q,
      placeholder: 'Search memes or tags',
      'aria-label': 'Search memes, tags and creators',
      onChange: onQueryChange,
    },
    typeSelectProps: {
      value: context.type,
      'aria-label': 'Filter by media type',
      onChange: onTypeChange,
    },
    tierSelectProps: {
      value: context.tier,
      'aria-label': 'Filter by tier',
      onChange: onTierChange,
    },
    listedInputProps: { checked: context.listed, onChange: onListedChange },
    sortChips: buildSortChipsModel({
      sortKey: context.sortKey,
      dir: context.sortDir,
      onChange: (sortKey, sortDir) => {
        send({ type: 'SET_SORT', sortKey, sortDir })
        syncUrl()
        fetchFromStart()
      },
      disabledReason: SORT_DISABLED_REASON,
    }),
    createLinkProps: { to: '/binder/new' },
    filtersToggleProps: {
      onClick: () => send({ type: 'TOGGLE_FILTERS' }),
      'aria-expanded': context.filtersOpen,
      'aria-controls': FILTERS_PANEL_ID,
    },
    filtersToggleLabel: hiddenFilterCount ? `Filters · ${hiddenFilterCount}` : 'Filters',
    filtersPanelProps: {
      id: FILTERS_PANEL_ID,
      'data-collapsed': context.filtersOpen ? 'false' : 'true',
    },
    statusProps: { role: 'status', 'aria-live': 'polite' },
    resultsLabel,
    clearFiltersProps: narrowed ? { onClick: onClearFilters } : null,
    showLoading,
    showEmpty,
    showError,
    showGrid,
    showMore,
    skeletonCount: SKELETON_COUNT,
    errorMessage: LOAD_ERROR,
    retryButtonProps: { onClick: fetchFromStart, disabled: refreshing },
    retryLabel: refreshing ? 'Trying again…' : 'Try again',
    loadMoreProps: {
      onClick: () => void loadMore(true),
      disabled: context.busy === 'more',
      'aria-busy': context.busy === 'more',
    },
    loadMoreLabel: context.busy === 'more'
      ? 'Loading…'
      : context.moreErr
        ? 'Try again'
        : 'Load more',
    loadMoreError: context.moreErr ? MORE_ERROR : null,
    endOfListLabel: showGrid && !context.nextCursor
      ? "That's every meme matching these filters."
      : null,
    sentinelRef,
  }
}
