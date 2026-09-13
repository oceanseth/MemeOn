import { useProjectedActor } from './useProjectedActor'
import { useCallback, useMemo, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TIERS } from '@memeon/shared/tiers'
import { marketplaceCopy } from '../copy/marketplace'
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
const copy = marketplaceCopy

/** One pressed tab in the filter row. */
export interface MarketFilterTabModel {
  /** the filter value the tab stands for; `''` is the "All memes" / "everything" tab */
  key: string
  label: string
  pressed: boolean
  buttonProps: { onClick: () => void; 'aria-pressed': boolean }
}

/** Media type + "For sale" as pressed tabs; eight tiers stay a Select. */
export interface MarketFilterTabsModel {
  media: readonly MarketFilterTabModel[]
  mediaGroupProps: { role: 'group'; 'aria-label': string }
  listed: MarketFilterTabModel
}

const MEDIA_TABS: readonly { key: string; label: string }[] = [
  { key: '', label: copy.filters.media.all },
  { key: 'image', label: copy.filters.media.images },
  { key: 'video', label: copy.filters.media.videos },
]

export interface BuildMarketFilterTabsInput {
  type: string
  listed: boolean
  onTypeChange: (value: string) => void
  onListedChange: (listed: boolean) => void
}

/** Exported so the screen's stories build the same row the hook does, state by state. */
export function buildMarketFilterTabs({
  type, listed, onTypeChange, onListedChange,
}: BuildMarketFilterTabsInput): MarketFilterTabsModel {
  return {
    media: MEDIA_TABS.map((tab) => ({
      key: tab.key,
      label: tab.label,
      pressed: tab.key === type,
      buttonProps: { onClick: () => onTypeChange(tab.key), 'aria-pressed': tab.key === type },
    })),
    mediaGroupProps: { role: 'group', 'aria-label': copy.filters.media.groupLabel },
    listed: {
      key: 'listed',
      label: copy.filters.listed,
      pressed: listed,
      buttonProps: { onClick: () => onListedChange(!listed), 'aria-pressed': listed },
    },
  }
}

export interface MarketplaceScreenModel {
  phase: MarketplacePhase
  cards: readonly MemeCardModel[]
  queryInputProps: {
    value: string
    placeholder: string
    'aria-label': string
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  filterTabs: MarketFilterTabsModel
  tierSelectProps: {
    value: string
    'aria-label': string
    onValueChange: (value: string | null) => void
  }
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

const typeLabel = (type: string): string => (type === 'video' ? copy.filters.media.videos : copy.filters.media.images)

const tierLabel = (tier: string): string =>
  TIERS.find((candidate) => candidate.key === tier)?.name ?? tier

function activeFilterLabels(ctx: MarketplaceContext): string[] {
  const labels: string[] = []
  if (ctx.q) labels.push(copy.results.activeQuery(ctx.q))
  if (ctx.type) labels.push(typeLabel(ctx.type))
  if (ctx.tier) labels.push(tierLabel(ctx.tier))
  if (ctx.listed) labels.push(copy.results.activeListed)
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
      .catch(() => send({ type: 'FAIL', err: copy.machine.loadFailed }))
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
      send({ type: 'MORE_FAILED', err: copy.machine.appendFailed })
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
  const onTypeChange = (value: string) => {
    send({ type: 'SET_TYPE', value })
    syncUrl()
    scheduleFetch()
  }
  const onTierChange = (value: string | null) => {
    send({ type: 'SET_TIER', value: value ?? '' })
    syncUrl()
    scheduleFetch()
  }
  const onListedChange = (listed: boolean) => {
    send({ type: 'SET_LISTED', listed })
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
    ? copy.results.countSoFar(cards.length)
    : copy.results.count(cards.length)
  // one status line: the count doubles as the live region, and the alert box owns the error copy
  const resultsLabel = showLoading || refreshing
    ? copy.results.searching
    : copy.results.line([showError ? copy.results.errored : showEmpty ? copy.results.empty : countLabel, ...filterLabels])
  const hiddenFilterCount = [context.type, context.tier, context.listed ? 'listed' : ''].filter(
    Boolean,
  ).length

  return {
    phase,
    cards,
    queryInputProps: {
      value: context.q,
      placeholder: copy.search.placeholder,
      'aria-label': copy.search.label,
      onChange: onQueryChange,
    },
    filterTabs: buildMarketFilterTabs({
      type: context.type,
      listed: context.listed,
      onTypeChange,
      onListedChange,
    }),
    tierSelectProps: {
      value: context.tier,
      'aria-label': copy.filters.tierLabel,
      onValueChange: onTierChange,
    },
    sortChips: buildSortChipsModel({
      sortKey: context.sortKey,
      dir: context.sortDir,
      onChange: (sortKey, sortDir) => {
        send({ type: 'SET_SORT', sortKey, sortDir })
        syncUrl()
        fetchFromStart()
      },
      disabledReason: copy.sortDisabledReason,
    }),
    createLinkProps: { to: '/binder/new' },
    filtersToggleProps: {
      onClick: () => send({ type: 'TOGGLE_FILTERS' }),
      'aria-expanded': context.filtersOpen,
      'aria-controls': FILTERS_PANEL_ID,
    },
    filtersToggleLabel: hiddenFilterCount ? copy.filters.toggleWithCount(hiddenFilterCount) : copy.filters.toggle,
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
    errorMessage: copy.loadError,
    retryButtonProps: { onClick: fetchFromStart, disabled: refreshing },
    retryLabel: refreshing ? copy.retrying : copy.retry,
    loadMoreProps: {
      onClick: () => void loadMore(true),
      disabled: context.busy === 'more',
      'aria-busy': context.busy === 'more',
    },
    loadMoreLabel: context.busy === 'more'
      ? copy.loadingMore
      : context.moreErr
        ? copy.loadMoreRetry
        : copy.loadMore,
    loadMoreError: context.moreErr ? copy.loadMoreError : null,
    endOfListLabel: showGrid && !context.nextCursor
      ? copy.endOfList
      : null,
    sentinelRef,
  }
}
