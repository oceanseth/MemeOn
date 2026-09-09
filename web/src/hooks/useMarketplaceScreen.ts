import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { apiFetch } from '../lib/api'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel, type SortChipsModel } from '../lib/sortChipsModel'
import { sortMemes } from '../lib/sorting'
import type { Meme } from '../lib/types'
import { marketplaceMachine, type MarketplacePhase } from '../stores/marketplaceMachine'
import { useMountEffect } from './useMountEffect'

const PAGE = 60

export interface MarketplaceScreenModel {
  phase: MarketplacePhase
  cards: readonly MemeCardModel[]
  queryInputProps: { value: string; onChange: ChangeEventHandler<HTMLInputElement> }
  typeSelectProps: { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }
  tierSelectProps: { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }
  listedInputProps: { checked: boolean; onChange: ChangeEventHandler<HTMLInputElement> }
  sortChips: SortChipsModel
  createLinkProps: { to: string }
  showLoading: boolean
  showEmpty: boolean
  showGrid: boolean
  showMore: boolean
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

/** Marketplace query, cursor continuation, filter decoding, and sorted card models. */
export function useMarketplaceScreen(): MarketplaceScreenModel {
  const [snapshot, send, actor] = useProjectedActor(marketplaceMachine)
  const loadingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const context = snapshot.context
  const phase = snapshot.value as MarketplacePhase

  const fetchFromStart = useCallback(() => {
    const live = actor.getSnapshot().context
    loadingRef.current = true
    apiFetch<{ memes: Meme[]; nextCursor: string | null }>(`/api/memes?${queryString(live)}`)
      .then((result) => send({ type: 'LOADED', memes: result.memes, nextCursor: result.nextCursor }))
      .catch(() => send({ type: 'FAIL', err: 'load failed' }))
      .finally(() => { loadingRef.current = false })
  }, [actor, send])

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fetchFromStart, 250)
  }, [fetchFromStart])

  const loadMore = useCallback(async () => {
    const live = actor.getSnapshot().context
    if (loadingRef.current || !live.nextCursor) return
    loadingRef.current = true
    try {
      const result = await apiFetch<{ memes: Meme[]; nextCursor: string | null }>(
        `/api/memes?${queryString(live)}&cursor=${encodeURIComponent(live.nextCursor)}`,
      )
      send({ type: 'APPEND', memes: result.memes, nextCursor: result.nextCursor })
    } catch {
      send({ type: 'CURSOR', nextCursor: null })
    } finally {
      loadingRef.current = false
    }
  }, [actor, send])

  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore
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

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    send({ type: 'SET_Q', q: event.target.value })
    scheduleFetch()
  }
  const onTypeChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    send({ type: 'SET_TYPE', value: event.target.value })
    scheduleFetch()
  }
  const onTierChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    send({ type: 'SET_TIER', value: event.target.value })
    scheduleFetch()
  }
  const onListedChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    send({ type: 'SET_LISTED', listed: event.target.checked })
    scheduleFetch()
  }
  const showLoading = phase === 'loading'
  const showEmpty = phase === 'empty' || phase === 'error'
  const showGrid = phase === 'ready'

  return {
    phase,
    cards: sortMemes(context.memes, context.sortKey, context.sortDir).map(buildMemeCardModel),
    queryInputProps: { value: context.q, onChange: onQueryChange },
    typeSelectProps: { value: context.type, onChange: onTypeChange },
    tierSelectProps: { value: context.tier, onChange: onTierChange },
    listedInputProps: { checked: context.listed, onChange: onListedChange },
    sortChips: buildSortChipsModel({
      sortKey: context.sortKey,
      dir: context.sortDir,
      onChange: (sortKey, sortDir) => send({ type: 'SET_SORT', sortKey, sortDir }),
    }),
    createLinkProps: { to: '/binder/new' },
    showLoading,
    showEmpty,
    showGrid,
    showMore: showGrid && !!context.nextCursor,
    sentinelRef,
  }
}
