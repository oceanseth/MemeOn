import { assign, setup } from 'xstate'
import type { FriendEntry, Meme } from '../lib/types'

export type FriendsPhase = 'loading' | 'ready' | 'empty' | 'error'

export interface UserHit {
  sub: string
  name: string
  picture: string | null
}

export type GiftTarget = { sub: string; name: string }

export interface FriendsContext {
  friends: FriendEntry[]
  query: string
  hits: UserHit[]
  msg: string | null
  onlineSubs: string[]
  gifting: GiftTarget | null
  giftMemes: Meme[]
  giftQuery: string
  giftPick: Meme | null
  giftShares: number
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
  | { type: 'SET_ONLINE'; onlineSubs: string[] }
  | { type: 'OPEN_GIFT'; recipient: GiftTarget }
  | { type: 'CLOSE_GIFT' }
  | { type: 'SET_GIFT_MEMES'; memes: Meme[] }
  | { type: 'SET_GIFT_QUERY'; query: string }
  | { type: 'SET_GIFT_PICK'; pick: Meme }
  | { type: 'SET_GIFT_SHARES'; shares: number }
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
    onlineSubs: [],
    gifting: null,
    giftMemes: [],
    giftQuery: '',
    giftPick: null,
    giftShares: 1,
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
    SET_ONLINE: { actions: assign({ onlineSubs: ({ event }) => event.onlineSubs }) },
    OPEN_GIFT: {
      actions: assign({
        gifting: ({ event }) => event.recipient,
        giftPick: null,
        giftQuery: '',
        giftShares: 1,
        giftErr: null,
        giftBusy: false,
      }),
    },
    CLOSE_GIFT: { actions: assign({ gifting: null, giftBusy: false }) },
    SET_GIFT_MEMES: { actions: assign({ giftMemes: ({ event }) => event.memes }) },
    SET_GIFT_QUERY: { actions: assign({ giftQuery: ({ event }) => event.query }) },
    SET_GIFT_PICK: {
      actions: assign({
        giftPick: ({ event }) => event.pick,
        giftShares: ({ event, context }) => Math.min(context.giftShares, event.pick.myShares ?? 1),
      }),
    },
    SET_GIFT_SHARES: { actions: assign({ giftShares: ({ event }) => event.shares }) },
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
