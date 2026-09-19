import { pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/** Every string the Profile screen spells itself; the cards read `lib/memeCardModel`. */
export const profileCopy = {
  /** Route names for `document.title`; never the player's display name. */
  documentTitle: {
    profile: 'Profile',
    /** `/binder/:sub` public binder — not `My Binder`, not the fetched name. */
    binder: 'Binder',
  },
  /** tab names; the grid's accessible name leads with the current one */
  tabs: {
    created: 'Created',
    binder: 'Binder',
    section: 'Profile section',
    trigger: (name: string, count: number) => `${name} (${count})`,
  },
  grid: {
    label: (tabName: string, count: number) => `${tabName} memes, ${count} ${pluralWord(count, 'card')}`,
    count: (visible: number, total: number) => `Showing ${visible} of ${total}`,
    showMore: (count: number) => `Show ${count} more`,
  },
  loading: 'Loading profile',
  loadError: {
    notFound: {
      title: "No one's minted under this link.",
      body: 'This profile may have been deleted.',
    },
    transport: {
      title: "Couldn't load this profile.",
      body: sharedCopy.checkConnection,
    },
    retry: sharedCopy.retry,
    browse: sharedCopy.browseMarketplace,
  },
  errors: {
    update: "Couldn't update — try again.",
    /** Fallback when the profile fetch throws without a message. */
    loadFailed: 'profile load failed',
    copy: 'Copy failed — try again',
  },
  /** stands in for the name while the profile has not loaded */
  fallbackName: 'this player',
  share: {
    title: (name: string) => `${name} on MemeOn`,
    fallbackTitle: sharedCopy.brand,
  },
  hero: {
    /** the page title on a shared binder link */
    binderTitle: (name: string) => `${name}'s binder`,
    publicIntro: 'A collection worth passing around.',
    visitorIntro: (createdCount: number, binderCount: number) =>
      `A collection worth passing around · ${createdCount} ${pluralWord(createdCount, 'meme')} · ${binderCount} in binder`,
    /** the identity card's line when the title did not already say it */
    identity: (name: string) => `Binder of ${name}`,
  },
  /** stat glyphs stay visible for wayfinding but never enter the accessible name */
  stats: {
    minted: (count: number) => `${count} minted`,
    inBinder: (count: number) => `${count} in binder`,
    braincells: (portfolioValue: number) => `${portfolioValue.toLocaleString()} braincells`,
    braincellsHeld: (portfolioValue: number) => `${portfolioValue.toLocaleString()} braincells held`,
    collection: (count: number) => `${count} ${pluralWord(count, 'meme')}`,
    held: (portfolioValue: number) => `${portfolioValue.toLocaleString()} held`,
    followers: (count: number) => `${count} ${pluralWord(count, 'follower')}`,
  },
  actions: {
    /** both relationship groups (other-profile and self) share this name */
    groupLabel: 'Profile actions',
    trade: 'Trade',
    tradeWith: (name: string) => `Trade with ${name}`,
    share: 'Share binder',
    settings: 'Settings',
    /**
     * Words only. The off/on pair used to spell a raw ☆/★ here, which is how the emoji sweep
     * walked past it — a character inside a copy string is not markup. It is `useProfileScreen`'s
     * `followGlyph` now (`star`/`star-filled`), on the same footing as `friendGlyph` and the stat
     * glyphs that left this file in 8165e4e.
     */
    follow: {
      label: 'Follow',
      labelOn: 'Following',
      busy: 'Following…',
      busyOn: 'Unfollowing…',
    },
    friend: {
      add: 'Add friend',
      accept: 'Accept request',
      adding: 'Sending…',
      accepting: 'Accepting…',
    },
    friendChip: {
      friends: 'Friends',
      pending: 'Request sent',
    },
  },
  join: {
    trade: (name: string) => `Log in to trade with ${name}`,
    binder: 'Log in to start your own binder',
    /** identity-card CTA on a public profile; footer keeps `trade` / `binder` via joinLabel */
    addFriend: 'Log in to add friend',
    /** closing line under the join CTA on public profiles */
    reshareNote: 'Every reshare of these links levels the cards up.',
  },
  cards: {
    /** on others' binders */
    holds: (shares: number) => `holds ${shares}/100`,
    /** on yours */
    yourShares: (shares: number) => `${shares}/100 shares`,
  },
  empty: {
    self: {
      created: {
        title: "You haven't minted anything yet.",
        body: 'Every meme you mint lands here as a 100-share card.',
        link: 'Mint your first meme',
      },
      binder: {
        title: "You don't hold shares in any memes yet.",
        body: "Buy into someone else's card and your shares show up here.",
        link: sharedCopy.browseMarketplace,
      },
    },
    other: {
      created: {
        title: (name: string) => `${name} hasn't minted anything yet.`,
        body: 'New cards land here the moment they mint one.',
      },
      binder: {
        title: (name: string) => `${name} doesn't hold shares in any memes yet.`,
        body: 'Shares they buy, win or get gifted show up here.',
      },
    },
  },
} as const
