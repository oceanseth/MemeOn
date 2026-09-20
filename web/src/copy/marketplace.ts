import { pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/** Every string the Marketplace screen shows. Keys name the role, not the content. */
export const marketplaceCopy = {
  pageTitle: 'Marketplace',
  intro: 'Find your next group-chat obsession.',
  sectionHeading: 'The good stuff',
  /** Words only; MarketplaceScreen draws the `circle-plus` the Mint tab and the shell's link wear. */
  mint: 'Mint a meme',
  allMemesPill: 'All memes',
  allMemesPillA11y: 'All memes, clear every filter',
  allTiers: 'All tiers',
  clearFilters: 'Clear filters',
  empty: {
    heading: 'Nothing here yet',
    body: 'No memes match these filters. Be the change — mint one!',
  },
  errorHeading: "Couldn't load the market",
  search: {
    placeholder: 'Search memes or tags',
    label: 'Search memes, tags and creators',
  },
  filters: {
    media: {
      groupLabel: 'Filter by media type',
      all: 'All memes',
      images: 'Images',
      videos: 'Videos',
    },
    listed: 'For sale',
    tierLabel: 'Filter by tier',
    /** the phone disclosure pill; the count is how many filters are hidden behind it */
    toggle: 'Filters',
    toggleWithCount: (hidden: number) => `Filters · ${hidden}`,
  },
  /**
   * `GET /api/memes` pages the catalogue newest-first and takes no sort key, so ranking by a stat
   * would only reorder the pages already loaded. The chips stay visible and inert until the API can
   * rank, rather than presenting a sample as the leaderboard of the whole market.
   */
  sortDisabledReason: "Newest first — the market can't rank by views, reshares or value yet.",
  /** the one status line: count (or state) first, then the active filters, joined by a middot */
  results: {
    searching: 'Searching the market…',
    errored: 'No memes loaded',
    empty: 'Nothing matches',
    /** the figure is the raw length, never grouped: `1200 memes` */
    count: (count: number) => `${count} ${pluralWord(count, 'meme')}`,
    countSoFar: (count: number) => `${count} ${pluralWord(count, 'meme')} so far`,
    /** the active filters as they read in the status line */
    activeQuery: (query: string) => `“${query}”`,
    activeListed: 'for sale',
    line: (parts: readonly string[]) => parts.join(' · '),
  },
  loadError: "Couldn't reach the market. Your filters are still set.",
  retry: sharedCopy.tryAgain,
  retrying: 'Trying again…',
  loadMore: 'Load more',
  loadingMore: sharedCopy.loading,
  loadMoreRetry: sharedCopy.tryAgain,
  loadMoreError: "Couldn't pull the next page.",
  endOfList: "That's all.",
  /** Machine fallbacks when the fetch throws without a message. */
  machine: { loadFailed: 'load failed', appendFailed: 'append failed' },
} as const
