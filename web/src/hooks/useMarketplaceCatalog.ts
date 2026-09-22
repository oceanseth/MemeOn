import { useCallback, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { marketplaceCopy } from '../copy/marketplace'
import { apiFetch } from '../lib/api'
import {
  MARKETPLACE_SEARCH_DEBOUNCE_MS,
  queryString,
  writeLiveFilters,
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
  // A newer refresh or unmount retires in-flight catalogue IO. Only that epoch may send or unlock.
  const generationRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchFromStart = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const generation = ++generationRef.current
    loadingRef.current = true
    const live = actor.getSnapshot().context
    send({ type: 'FETCHING', scope: 'refresh' })
    apiFetch<{ memes: Meme[]; nextCursor: string | null }>(`/api/memes?${queryString(live)}`)
      .then((result) => {
        if (generation !== generationRef.current) return
        send({
          type: 'LOADED',
          memes: result.memes,
          nextCursor: result.nextCursor,
        })
      })
      .catch(() => {
        if (generation !== generationRef.current) return
        send({ type: 'FAIL', err: copy.machine.loadFailed })
      })
      .finally(() => {
        if (generation !== generationRef.current) return
        loadingRef.current = false
      })
  }, [actor, send])

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fetchFromStart, MARKETPLACE_SEARCH_DEBOUNCE_MS)
  }, [fetchFromStart])

  /** The observer keeps firing while the sentinel is in view, so a failed page waits to be retried. */
  const loadMore = useCallback(
    async (manual = false) => {
      const live = actor.getSnapshot().context
      if (loadingRef.current || !live.nextCursor) return
      if (live.moreErr && !manual) return
      const generation = generationRef.current
      loadingRef.current = true
      send({ type: 'FETCHING', scope: 'more' })
      try {
        const result = await apiFetch<{
          memes: Meme[]
          nextCursor: string | null
        }>(`/api/memes?${queryString(live)}&cursor=${encodeURIComponent(live.nextCursor)}`)
        if (generation !== generationRef.current) return
        send({
          type: 'APPEND',
          memes: result.memes,
          nextCursor: result.nextCursor,
        })
      } catch {
        if (generation !== generationRef.current) return
        send({ type: 'MORE_FAILED', err: copy.machine.appendFailed })
      } finally {
        if (generation === generationRef.current) loadingRef.current = false
      }
    },
    [actor, send],
  )

  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore
  // Callback freshness comes from loadMoreRef.current, but the cursor dependency is load-bearing:
  // re-observing after each page re-delivers the intersection while the sentinel is still on
  // screen, which is how a sparse or duplicate-only page is crossed without a scroll.
  const sentinelRef = useCallback<RefCallback<HTMLDivElement>>(
    (element) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!element) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) void loadMoreRef.current()
        },
        { rootMargin: '900px' },
      )
      observer.observe(element)
      observerRef.current = observer
    },
    [nextCursor],
  )

  useMountEffect(() => {
    scheduleFetch()
    return () => {
      generationRef.current += 1
      if (timerRef.current) clearTimeout(timerRef.current)
      observerRef.current?.disconnect()
    }
  })

  /** Filters live in the URL so the market can be linked, reloaded and returned to with Back. */
  const syncUrl = useCallback(() => {
    const live = actor.getSnapshot().context
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        writeLiveFilters(next, live)
        return next
      },
      { replace: true },
    )
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
