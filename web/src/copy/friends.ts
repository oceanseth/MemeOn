import { braincells } from '../lib/braincells'
import { pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/**
 * Every string the Friends screen spells itself. The gift and remove dialogs read
 * `lib/giftDialogModel` and `lib/confirmDialogModel`; only what this screen hands them lives here.
 */
export const friendsCopy = {
  search: {
    inputLabel: 'Find people by name',
    searching: 'Searching…',
    noHits: (query: string) => `No one goes by "${query}" — check the spelling, or invite them.`,
    /** WCAG 2.5.3: the button's visible words lead its accessible name */
    requestLabel: (name: string) => `Add friend — send ${name} a friend request`,
  },
  invite: {
    button: '💌 Invite a friend',
    copied: 'Invite link copied ✓',
    /** the platform share sheet, when there is one */
    share: {
      title: 'Join me on MemeOn',
      text: 'Memes are the new trading cards — join me on MemeOn!',
    },
  },
  online: {
    /** trailing caption on the online strip */
    count: (count: number) => `${count} ${pluralWord(count, 'friend')} online`,
    label: 'Online now',
  },
  row: {
    stats: (collectionSize: number, portfolioValue: number) =>
      `📚 ${collectionSize} ${pluralWord(collectionSize, 'meme')} · ${braincells(portfolioValue)} held`,
    accept: (name: string) => `Accept ${name}'s request`,
    decline: (name: string) => `Decline ${name}'s request`,
    pending: 'Pending',
    cancelRequest: (name: string) => `Cancel your request to ${name}`,
    trade: 'Trade',
    tradeWith: (name: string) => `Trade with ${name}`,
    gift: 'Gift',
    giftTo: (name: string) => `Gift shares to ${name}`,
    remove: 'Remove',
    removeName: (name: string) => `Remove ${name}`,
  },
  toasts: {
    requestSent: 'Friend request sent 👋',
    gifted: (shares: number, title: string, recipient: string) =>
      `🎁 Gifted ${shares} ${pluralWord(shares, 'share')} of "${title}" to ${recipient}`,
  },
  errors: {
    request: "Couldn't send that friend request. Try again in a moment.",
    respond: "Couldn't update that request. Try again.",
    remove: "Couldn't remove that friend. Try again.",
    /** the gift dialog shows the API's own message when it has one; this is the fallback */
    gift: 'That gift did not go through. Try again.',
  },
  loading: 'Loading friends…',
  loadError: {
    title: "Couldn't load your friends.",
    body: sharedCopy.checkConnection,
    retry: sharedCopy.retry,
  },
  empty: {
    title: 'No friends yet',
    body: "Invite someone and you can gift shares straight from your binder and watch each other's portfolios.",
  },
  circleHint: {
    incoming: 'Accept a request to start your circle.',
    outgoing: 'No one has accepted yet — your sent requests are still out there.',
  },
  /** keyed by `PendingRemoval['kind']` */
  removeDialog: {
    remove: {
      title: (name: string) => `Remove ${name}?`,
      body: "You'll drop out of each other's circles and lose the shortcut to trade and gift. You can send a new request later.",
      confirm: 'Remove',
      cancel: 'Keep friend',
    },
    decline: {
      title: (name: string) => `Decline ${name}'s request?`,
      body: 'They are not told. If you change your mind they can send a new request.',
      confirm: sharedCopy.decline,
      cancel: 'Keep it',
    },
  },
} as const
