import { TIERS } from '@memeon/shared/tiers'
import type { SelectOption } from '@/atoms/select'
import { marketplaceCopy } from '../copy/marketplace'
import type { SortDir, SortKey } from './sorting'
import type { MarketplaceContext, MarketplaceInput } from '../stores/marketplaceMachine'

export const MARKETPLACE_PAGE_SIZE = 60
export const MARKETPLACE_SEARCH_DEBOUNCE_MS = 250
export const FILTERS_PANEL_ID = 'market-filters'

const copy = marketplaceCopy

/** One item of the media `ToggleGroup`; `all` stands for the empty filter. */
export interface MarketFilterTabModel {
  key: string
  label: string
  pressed: boolean
}

/** Base UI needs a non-empty item value, so "everything" travels as `all`. */
const ALL_MEDIA = 'all'

/** Media type is a single-choice `ToggleGroup`; "For sale" is one `Toggle`; tiers stay a Select. */
export interface MarketFilterTabsModel {
  media: readonly MarketFilterTabModel[]
  mediaGroupProps: {
    'aria-label': string
    value: readonly string[]
    onValueChange: (value: string[]) => void
  }
  listed: {
    label: string
    pressed: boolean
    onPressedChange: (pressed: boolean) => void
  }
}

export const MEDIA_TABS: readonly {
  key: string
  value: string
  label: string
}[] = [
  { key: ALL_MEDIA, value: '', label: copy.filters.media.all },
  { key: 'image', value: 'image', label: copy.filters.media.images },
  { key: 'video', value: 'video', label: copy.filters.media.videos },
]

export interface BuildMarketFilterTabsInput {
  type: string
  listed: boolean
  onTypeChange: (value: string) => void
  onListedChange: (listed: boolean) => void
}

/** Exported so the screen's stories build the same row the hook does, state by state. */
export function buildMarketFilterTabs({
  type,
  listed,
  onTypeChange,
  onListedChange,
}: BuildMarketFilterTabsInput): MarketFilterTabsModel {
  return {
    media: MEDIA_TABS.map((tab) => ({
      key: tab.key,
      label: tab.label,
      pressed: tab.value === type,
    })),
    mediaGroupProps: {
      'aria-label': copy.filters.media.groupLabel,
      value: [type || ALL_MEDIA],
      // deselecting the pressed item is "show everything", which is the `all` item
      onValueChange: (value) => onTypeChange(!value[0] || value[0] === ALL_MEDIA ? '' : value[0]),
    },
    listed: {
      label: copy.filters.listed,
      pressed: listed,
      onPressedChange: (pressed) => onListedChange(pressed),
    },
  }
}

/** Static: the tiers and their labels never change between renders, so the Select sees one array. */
export const TIER_SELECT_ITEMS: readonly SelectOption[] = [
  { value: '', label: copy.allTiers },
  ...TIERS.map((tier) => ({ value: tier.key, label: tier.name })),
]

/** GET /api/memes takes q / type / tier / listed / limit / cursor only — never sort or dir. */
export function queryString(ctx: {
  q: string
  type: string
  tier: string
  listed: boolean
}): string {
  const params = new URLSearchParams()
  if (ctx.q) params.set('q', ctx.q)
  if (ctx.type) params.set('type', ctx.type)
  if (ctx.tier) params.set('tier', ctx.tier)
  if (ctx.listed) params.set('listed', 'true')
  params.set('limit', String(MARKETPLACE_PAGE_SIZE))
  return params.toString()
}

export const isSortKey = (value: string | null): value is SortKey =>
  value === 'new' || value === 'views' || value === 'reshares' || value === 'value'

export const isSortDir = (value: string | null): value is SortDir =>
  value === 'asc' || value === 'desc'

/** The shareable half of the market: everything a link has to carry to reopen the same shelf. */
export function filtersFromUrl(params: URLSearchParams): MarketplaceInput {
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

export function writeFilter(
  params: URLSearchParams,
  key: string,
  value: string,
  fallback = '',
): void {
  if (value === fallback) params.delete(key)
  else params.set(key, value)
}

export function writeLiveFilters(
  params: URLSearchParams,
  live: {
    q: string
    type: string
    tier: string
    listed: boolean
    sortKey: string
    sortDir: string
  },
): void {
  writeFilter(params, 'q', live.q)
  writeFilter(params, 'type', live.type)
  writeFilter(params, 'tier', live.tier)
  writeFilter(params, 'listed', live.listed ? 'true' : '')
  writeFilter(params, 'sort', live.sortKey, 'new')
  writeFilter(params, 'dir', live.sortDir, 'desc')
}

const typeLabel = (type: string): string =>
  type === 'video' ? copy.filters.media.videos : copy.filters.media.images

const tierLabel = (tier: string): string =>
  TIERS.find((candidate) => candidate.key === tier)?.name ?? tier

export function activeFilterLabels(ctx: MarketplaceContext): string[] {
  const labels: string[] = []
  if (ctx.q) labels.push(copy.results.activeQuery(ctx.q))
  if (ctx.type) labels.push(typeLabel(ctx.type))
  if (ctx.tier) labels.push(tierLabel(ctx.tier))
  if (ctx.listed) labels.push(copy.results.activeListed)
  return labels
}
