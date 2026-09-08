import { useMachine } from '@xstate/react'
import { useCallback, useRef, type RefCallback } from 'react'
import { apiFetch } from '../lib/api'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../molecules/SortChips'
import {
  marketplaceMachine,
  type MarketplacePhase,
} from '../stores/marketplaceMachine'
import { useMountEffect } from './useMountEffect'

const PAGE = 60

export interface MarketplaceScreenModel {
  phase: MarketplacePhase
  memes: Meme[]
  nextCursor: string | null
  q: string
  type: string
  tier: string
  listed: boolean
  sortKey: SortKey
  sortDir: SortDir
  showLoading: boolean
  showEmpty: boolean
  showGrid: boolean
  showMore: boolean
  sentinelRef?: RefCallback<HTMLDivElement> | undefined
  onQueryChange: (q: string) => void
  onTypeChange: (type: string) => void
  onTierChange: (tier: string) => void
  onListedChange: (listed: boolean) => void
  onSortChange: (key: SortKey, dir: SortDir) => void
}

function queryString(ctx: {
  q: string
  type: string
  tier: string
  listed: boolean
}): string {
  const p = new URLSearchParams()
  if (ctx.q) p.set('q', ctx.q)
  if (ctx.type) p.set('type', ctx.type)
  if (ctx.tier) p.set('tier', ctx.tier)
  if (ctx.listed) p.set('listed', 'true')
  p.set('limit', String(PAGE))
  return p.toString()
}

/** Everything `MarketplaceScreen` renders. The hook is the engine; the screen is the terminal. */
export function useMarketplaceScreen(): MarketplaceScreenModel {
  const [snapshot, send, actor] = useMachine(marketplaceMachine)
  const loadingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as MarketplacePhase

  const fetchFromStart = useCallback(() => {
    const live = actor.getSnapshot().context
    loadingRef.current = true
    apiFetch<{ memes: Meme[]; nextCursor: string | null }>(`/api/memes?${queryString(live)}`)
      .then((r) => send({ type: 'LOADED', memes: r.memes, nextCursor: r.nextCursor }))
      .catch(() => send({ type: 'FAIL', err: 'load failed' }))
      .finally(() => {
        loadingRef.current = false
      })
  }, [actor, send])

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchFromStart()
    }, 250)
  }, [fetchFromStart])

  const loadMore = useCallback(async () => {
    const live = actor.getSnapshot().context
    if (loadingRef.current || !live.nextCursor) return
    loadingRef.current = true
    try {
      const r = await apiFetch<{ memes: Meme[]; nextCursor: string | null }>(
        `/api/memes?${queryString(live)}&cursor=${encodeURIComponent(live.nextCursor)}`,
      )
      send({ type: 'APPEND', memes: r.memes, nextCursor: r.nextCursor })
    } catch {
      send({ type: 'CURSOR', nextCursor: null })
    } finally {
      loadingRef.current = false
    }
  }, [actor, send])

  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  const sentinelRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreRef.current()
      },
      { rootMargin: '900px' },
    )
    obs.observe(el)
    observerRef.current = obs
  }, [ctx.nextCursor])

  useMountEffect(() => {
    scheduleFetch()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      observerRef.current?.disconnect()
    }
  })

  const showLoading = phase === 'loading'
  const showEmpty = phase === 'empty' || phase === 'error'
  const showGrid = phase === 'ready'

  return {
    phase,
    memes: ctx.memes,
    nextCursor: ctx.nextCursor,
    q: ctx.q,
    type: ctx.type,
    tier: ctx.tier,
    listed: ctx.listed,
    sortKey: ctx.sortKey,
    sortDir: ctx.sortDir,
    showLoading,
    showEmpty,
    showGrid,
    showMore: showGrid && !!ctx.nextCursor,
    sentinelRef,
    onQueryChange: (q) => {
      send({ type: 'SET_Q', q })
      scheduleFetch()
    },
    onTypeChange: (type) => {
      send({ type: 'SET_TYPE', value: type })
      scheduleFetch()
    },
    onTierChange: (tier) => {
      send({ type: 'SET_TIER', value: tier })
      scheduleFetch()
    },
    onListedChange: (listed) => {
      send({ type: 'SET_LISTED', listed })
      scheduleFetch()
    },
    onSortChange: (sortKey, sortDir) => send({ type: 'SET_SORT', sortKey, sortDir }),
  }
}
