import { useProjectedActor } from './useProjectedActor'
import { useMemo, useRef, type ChangeEventHandler, type RefCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SelectOption } from '@/atoms/select'
import { marketplaceCopy } from '../copy/marketplace'
import { buildMemeCardModelForPlayback, type MemeCardModel } from '../lib/memeCardModel'
import {
  FILTERS_PANEL_ID,
  TIER_SELECT_ITEMS,
  activeFilterLabels,
  buildMarketFilterTabs,
  filtersFromUrl,
  type MarketFilterTabsModel,
} from '../lib/marketplaceQuery'
import { buildSortChipsModel, type SortChipsModel } from '../lib/sortChipsModel'
import {
  marketplaceMachine,
  type MarketplaceInput,
  type MarketplacePhase,
} from '../stores/marketplaceMachine'
import { useMarketplaceCatalog } from './useMarketplaceCatalog'
import { usePlayVideos } from './usePlayVideos'

const SKELETON_COUNT = 8
const copy = marketplaceCopy

export interface MarketplaceScreenModel {
  phase: MarketplacePhase
  pageTitle: string
  intro: string
  sectionHeading: string
  mintLabel: string
  allMemesPill: string
  allMemesPillA11y: string
  tierSelectItems: readonly SelectOption[]
  clearFiltersLabel: string
  emptyHeading: string
  emptyBody: string
  errorHeading: string
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
  loadMoreProps: {
    onClick: () => void
    disabled: boolean
    'aria-busy': boolean
  }
  loadMoreLabel: string
  loadMoreError: string | null
  endOfListLabel: string | null
  sentinelRef?: RefCallback<HTMLDivElement> | undefined
}

/** Named screen engine: projected actor + catalogue IO → MarketplaceScreenModel. */
export function useMarketplaceScreen(): MarketplaceScreenModel {
  const [params, setParams] = useSearchParams()
  const filtersRef = useRef<MarketplaceInput | null>(null)
  const initialFilters = (filtersRef.current ??= filtersFromUrl(params))
  const [snapshot, send, actor] = useProjectedActor(marketplaceMachine, {
    input: initialFilters,
  })
  const context = snapshot.context
  const phase = snapshot.value as MarketplacePhase
  const {
    fetchFromStart,
    loadMore,
    sentinelRef,
    onQueryChange,
    onTypeChange,
    onTierChange,
    onListedChange,
    onClearFilters,
    onSortChange,
  } = useMarketplaceCatalog({
    actor,
    send,
    setParams,
    nextCursor: context.nextCursor,
  })

  const { playVideos } = usePlayVideos()
  const cards = useMemo(
    () => context.memes.map((meme) => buildMemeCardModelForPlayback(meme, playVideos)),
    [context.memes, playVideos],
  )

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
  const resultsLabel =
    showLoading || refreshing
      ? copy.results.searching
      : copy.results.line([
          showError ? copy.results.errored : showEmpty ? copy.results.empty : countLabel,
          ...filterLabels,
        ])
  const hiddenFilterCount = [context.type, context.tier, context.listed ? 'listed' : ''].filter(
    Boolean,
  ).length

  return {
    phase,
    pageTitle: copy.pageTitle,
    intro: copy.intro,
    sectionHeading: copy.sectionHeading,
    mintLabel: copy.mint,
    allMemesPill: copy.allMemesPill,
    allMemesPillA11y: copy.allMemesPillA11y,
    tierSelectItems: TIER_SELECT_ITEMS,
    clearFiltersLabel: copy.clearFilters,
    emptyHeading: copy.empty.heading,
    emptyBody: copy.empty.body,
    errorHeading: copy.errorHeading,
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
      onChange: onSortChange,
      disabledReason: copy.sortDisabledReason,
    }),
    createLinkProps: { to: '/binder/new' },
    filtersToggleProps: {
      onClick: () => send({ type: 'TOGGLE_FILTERS' }),
      'aria-expanded': context.filtersOpen,
      'aria-controls': FILTERS_PANEL_ID,
    },
    filtersToggleLabel: hiddenFilterCount
      ? copy.filters.toggleWithCount(hiddenFilterCount)
      : copy.filters.toggle,
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
    loadMoreLabel:
      context.busy === 'more'
        ? copy.loadingMore
        : context.moreErr
          ? copy.loadMoreRetry
          : copy.loadMore,
    loadMoreError: context.moreErr ? copy.loadMoreError : null,
    endOfListLabel: showGrid && !context.nextCursor ? copy.endOfList : null,
    sentinelRef,
  }
}
