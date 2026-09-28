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
import { sharedCopy } from '../copy/shared'
import { prefersCommandKey, searchHotkeySlotRef } from '../lib/searchHotkey'
import { useMarketplaceCatalog } from './useMarketplaceCatalog'
import { useMasonryLayout, type MasonryGridModel } from './useMasonryLayout'
import { useMemeMediaSizes } from './useMemeMediaSizes'
import { MEME_CARD_META_HEIGHT, masonrySkeletonItems } from '../lib/masonry'
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
    'aria-keyshortcuts': string
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  /** The ⌘K / Ctrl K affordance: the chip in the well and the well ref the hotkey focuses. */
  searchHotkey: { label: string; slotRef: RefCallback<HTMLElement> }
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
  /** slots for the loading skeletons and the card grid alike, index-aligned with `cards` */
  masonry: MasonryGridModel
  showLoading: boolean
  showEmpty: boolean
  showError: boolean
  showGrid: boolean
  showMore: boolean
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
  // a card's frame needs its meme's size; the memes with none stored are measured here
  const mediaSizes = useMemeMediaSizes(context.memes)
  const cards = useMemo(
    () => context.memes.map((meme) => buildMemeCardModelForPlayback(meme, playVideos)),
    // mediaSizes: the builder reads the measured sizes, which move without the memes moving
    [context.memes, playVideos, mediaSizes],
  )

  const showLoading = phase === 'loading'
  const showEmpty = phase === 'empty'
  const showError = phase === 'error'
  const showGrid = phase === 'ready'
  const masonryItems = useMemo(
    () =>
      showLoading
        ? masonrySkeletonItems(SKELETON_COUNT)
        : cards.map((card) => ({ id: card.id, aspect: card.aspect })),
    [showLoading, cards],
  )
  const masonry = useMasonryLayout(masonryItems, MEME_CARD_META_HEIGHT)
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
      'aria-keyshortcuts': prefersCommandKey ? 'Meta+K' : 'Control+K',
      onChange: onQueryChange,
    },
    searchHotkey: {
      label: prefersCommandKey ? sharedCopy.searchHotkey.command : sharedCopy.searchHotkey.control,
      slotRef: searchHotkeySlotRef,
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
    masonry,
    showLoading,
    showEmpty,
    showError,
    showGrid,
    showMore,
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
