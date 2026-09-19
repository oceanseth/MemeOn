import { useCallback, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { marketplaceCopy } from '../copy/marketplace'
import { apiFetch } from '../lib/api'
import {
  MARKETPLACE_SEARCH_DEBOUNCE_MS,
  queryString,
  writeFilter,
} from '../lib/marketplaceQuery'
import type { SortDir, SortKey } from '../lib/sorting'
import type { Meme } from '../lib/types'
import type { MarketplaceContext, MarketplaceEvent } from '../stores/marketplaceMachine'
import { useMountEffect } from './useMountEffect'

const copy = marketplaceCopy

export interface UseMarketplaceCatalogArgs {
  actor: { getSnapshot: () => { context: MarketplaceContext } }
  send: (event: MarketplaceEvent) => void
  setParams: (
    updater: (current: URLSearchParams) => URLSearchParams,
    options: { replace: boolean },
  ) => void
  nextCursor: string | null
}

export interface MarketplaceCatalog {
  fetchFromStart: () => void
  loadMore: (manual?: boolean) => Promise<void>
  sentinelRef: RefCallback<HTMLDivElement>
  onQueryChange: ChangeEventHandler<HTMLInputElement>
  onTypeChange: (value: string) => void
  onTierChange: (value: string | null) => void
  onListedChange: (listed: boolean) => void
  onClearFilters: () => void
  onSortChange: (sortKey: SortKey, sortDir: SortDir) => void
}

/** Catalogue IO: fetch, 250ms debounce, cursor paging, sentinel, URL sync. */
export function useMarketplaceCatalog({
  actor,
  send,
  setParams,
  nextCursor,
}: UseMarketplaceCatalogArgs): MarketplaceCatalog {
  const loadingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

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
    timerRef.current = setTimeout(fetchFromStart, MARKETPLACE_SEARCH_DEBOUNCE_MS)
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
  }, [nextCursor])

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
  const onSortChange = (sortKey: SortKey, sortDir: SortDir) => {
    send({ type: 'SET_SORT', sortKey, sortDir })
    syncUrl()
    fetchFromStart()
  }

  return {
    fetchFromStart,
    loadMore,
    sentinelRef,
    onQueryChange,
    onTypeChange,
    onTierChange,
    onListedChange,
    onClearFilters,
    onSortChange,
  }
}
