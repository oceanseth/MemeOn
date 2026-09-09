import { assign, setup } from 'xstate'
import type { FriendEntry, Meme } from '../lib/types'

export type FriendsPhase = 'loading' | 'ready' | 'empty' | 'error'

export interface UserHit {
  sub: string
  name: string
  picture: string | null
}

export type GiftTarget = { sub: string; name: string }

/** A destructive relationship change waiting on its confirm dialog. */
export type PendingRemoval = { sub: string; name: string; kind: 'remove' | 'decline' }

export interface FriendsContext {
  friends: FriendEntry[]
  query: string
  hits: UserHit[]
  msg: string | null
  /** mutation failures; `err` stays reserved for the load failure that owns the error phase */
  actionErr: string | null
  /** sub whose accept / decline / remove / cancel request is in flight */
  pendingSub: string | null
  pendingRemoval: PendingRemoval | null
  searching: boolean
  onlineSubs: string[]
  gifting: GiftTarget | null
  giftMemes: Meme[]
  giftQuery: string
  giftPick: Meme | null
  giftShares: number
  /** raw field text while the user types; null means "show the clamped number" */
  giftSharesInput: string | null
  giftBusy: boolean
  giftErr: string | null
  copied: boolean
  err: string | null
}

export type FriendsEvent =
  | { type: 'DONE'; friends: FriendEntry[] }
  | { type: 'FAIL'; err: string }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_HITS'; hits: UserHit[] }
  | { type: 'SET_MSG'; msg: string | null }
  | { type: 'SET_ACTION_ERR'; err: string | null }
  | { type: 'SET_PENDING'; sub: string | null }
  | { type: 'ASK_REMOVE'; removal: PendingRemoval }
  | { type: 'CLOSE_REMOVE' }
  | { type: 'SET_SEARCHING'; searching: boolean }
  | { type: 'SET_ONLINE'; onlineSubs: string[] }
  | { type: 'OPEN_GIFT'; recipient: GiftTarget }
  | { type: 'CLOSE_GIFT' }
  | { type: 'SET_GIFT_MEMES'; memes: Meme[] }
  | { type: 'SET_GIFT_QUERY'; query: string }
  | { type: 'SET_GIFT_PICK'; pick: Meme }
  | { type: 'SET_GIFT_SHARES'; shares: number }
  | { type: 'SET_GIFT_SHARES_INPUT'; value: string | null }
  | { type: 'SET_GIFT_BUSY'; busy: boolean }
  | { type: 'SET_GIFT_ERR'; err: string | null }
  | { type: 'SET_COPIED'; copied: boolean }

/**
 * Friends list source of truth. loading → ready|empty|error.
 * Gift/search/presence live in context; the hook drives async work.
 */
export const friendsMachine = setup({
  types: {
    context: {} as FriendsContext,
    events: {} as FriendsEvent,
  },
}).createMachine({
  id: 'friends',
  context: {
    friends: [],
    query: '',
    hits: [],
    msg: null,
    actionErr: null,
    pendingSub: null,
    pendingRemoval: null,
    searching: false,
    onlineSubs: [],
    gifting: null,
    giftMemes: [],
    giftQuery: '',
    giftPick: null,
    giftShares: 1,
    giftSharesInput: null,
    giftBusy: false,
    giftErr: null,
    copied: false,
    err: null,
  },
  initial: 'loading',
  on: {
    SET_QUERY: { actions: assign({ query: ({ event }) => event.query }) },
    SET_HITS: { actions: assign({ hits: ({ event }) => event.hits }) },
    SET_MSG: { actions: assign({ msg: ({ event }) => event.msg }) },
    SET_ACTION_ERR: { actions: assign({ actionErr: ({ event }) => event.err }) },
    SET_PENDING: { actions: assign({ pendingSub: ({ event }) => event.sub }) },
    ASK_REMOVE: { actions: assign({ pendingRemoval: ({ event }) => event.removal }) },
    CLOSE_REMOVE: { actions: assign({ pendingRemoval: null }) },
    SET_SEARCHING: { actions: assign({ searching: ({ event }) => event.searching }) },
    SET_ONLINE: { actions: assign({ onlineSubs: ({ event }) => event.onlineSubs }) },
    OPEN_GIFT: {
      actions: assign({
        gifting: ({ event }) => event.recipient,
        giftPick: null,
        giftQuery: '',
        giftShares: 1,
        giftSharesInput: null,
        giftErr: null,
      }),
    },
    CLOSE_GIFT: { actions: assign({ gifting: null }) },
    SET_GIFT_MEMES: { actions: assign({ giftMemes: ({ event }) => event.memes }) },
    SET_GIFT_QUERY: { actions: assign({ giftQuery: ({ event }) => event.query }) },
    SET_GIFT_PICK: {
      actions: assign({
        giftPick: ({ event }) => event.pick,
        giftShares: ({ event, context }) => Math.min(context.giftShares, event.pick.myShares ?? 1),
        giftSharesInput: null,
      }),
    },
    SET_GIFT_SHARES: { actions: assign({ giftShares: ({ event }) => event.shares }) },
    SET_GIFT_SHARES_INPUT: { actions: assign({ giftSharesInput: ({ event }) => event.value }) },
    SET_GIFT_BUSY: { actions: assign({ giftBusy: ({ event }) => event.busy }) },
    SET_GIFT_ERR: { actions: assign({ giftErr: ({ event }) => event.err }) },
    SET_COPIED: { actions: assign({ copied: ({ event }) => event.copied }) },
    DONE: [
      {
        guard: ({ event }) => event.friends.length === 0,
        target: '.empty',
        actions: assign({ friends: ({ event }) => event.friends, err: null }),
      },
      {
        target: '.ready',
        actions: assign({ friends: ({ event }) => event.friends, err: null }),
      },
    ],
    FAIL: {
      target: '.error',
      actions: assign({ err: ({ event }) => event.err }),
    },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
