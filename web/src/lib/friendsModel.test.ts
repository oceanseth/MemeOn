import { createActor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import { friendsCopy as copy } from '../copy/friends'
import type { FriendEntry } from './types'
import { friendsMachine, type FriendsContext } from '../stores/friendsMachine'
import {
  buildFriendLinkModel,
  buildFriendsScreenModel,
  type FriendsScreenModelActions,
} from './friendsModel'

const pal: FriendEntry = {
  sub: 'pal',
  name: 'Pal',
  picture: '/pal.png',
  status: 'accepted',
  collectionSize: 3,
  portfolioValue: 12,
}

function context(overrides: Partial<FriendsContext> = {}): FriendsContext {
  return { ...createActor(friendsMachine).getSnapshot().context, ...overrides }
}

function actions(overrides: Partial<FriendsScreenModelActions> = {}): FriendsScreenModelActions {
  return {
    onQueryChange: vi.fn(),
    onCopyInvite: vi.fn(),
    onRequest: vi.fn(),
    onRespond: vi.fn(),
    onRemove: vi.fn(),
    onGiftOpen: vi.fn(),
    onGiftSubmit: vi.fn(),
    onGiftClose: vi.fn(),
    onGiftQueryChange: vi.fn(),
    onGiftPick: vi.fn(),
    onGiftSharesInput: vi.fn(),
    onGiftShares: vi.fn(),
    onGiftSharesBlur: vi.fn(),
    onAskRemove: vi.fn(),
    onConfirmRemoval: vi.fn(),
    onCancelRemove: vi.fn(),
    onLoad: vi.fn(),
    ...overrides,
  }
}

describe('buildFriendLinkModel', () => {
  it('keeps nullable avatar data out of screen markup while preserving its current display semantics', () => {
    const withAvatar = buildFriendLinkModel({ sub: 'pal', name: 'Pal', picture: '/pal.png' })
    const withoutAvatar = buildFriendLinkModel({ sub: 'no-picture', name: 'no picture', picture: null })

    expect(withAvatar.profileLinkProps).toEqual({ to: '/u/pal' })
    expect(withAvatar.onlineLinkProps).toEqual({ to: '/u/pal', title: 'Pal' })
    expect(withAvatar.avatarSrc).toBe('/pal.png')
    expect(withoutAvatar.avatarSrc).toBeNull()
  })
})

describe('buildFriendsScreenModel search flags', () => {
  it('shows searching only while the panel is open, in-flight, and hits are empty', () => {
    const searching = buildFriendsScreenModel('ready', context({ query: 'pal', searching: true }), actions())
    const withHits = buildFriendsScreenModel(
      'ready',
      context({
        query: 'pal',
        searching: true,
        hits: [{ sub: 'pal', name: 'Pal', picture: null }],
      }),
      actions(),
    )
    expect(searching.showSearchPanel).toBe(true)
    expect(searching.showSearching).toBe(true)
    expect(searching.showHits).toBe(false)
    expect(searching.showNoHits).toBe(false)
    expect(searching.showSearchFailed).toBe(false)
    expect(withHits.showSearching).toBe(false)
    expect(withHits.showHits).toBe(true)
  })

  it('shows noHits for an empty 200 and searchFailed when searchErr is set', () => {
    const noHits = buildFriendsScreenModel('ready', context({ query: 'pal' }), actions())
    const failed = buildFriendsScreenModel(
      'ready',
      context({
        query: 'pal',
        searchErr: copy.search.failed,
        hits: [{ sub: 'stale', name: 'Stale', picture: null }],
      }),
      actions(),
    )
    expect(noHits.showNoHits).toBe(true)
    expect(noHits.showSearchFailed).toBe(false)
    expect(noHits.noHitsMessage).toBe(copy.search.noHits('pal'))
    expect(failed.showSearchFailed).toBe(true)
    expect(failed.showNoHits).toBe(false)
    expect(failed.showHits).toBe(false)
    expect(failed.searchFailedMessage).toBe(copy.search.failed)
  })
})

describe('buildFriendsScreenModel 1.6 copy keys', () => {
  it('passes pageTitle, search placeholder, and section labels from friendsCopy', () => {
    const model = buildFriendsScreenModel('ready', context(), actions())
    expect(model.pageTitle).toBe(copy.pageTitle)
    expect(model.searchInputProps.placeholder).toBe(copy.search.placeholder)
    expect(model.searchResultsHeading).toBe(copy.search.resultsHeading)
    expect(model.addFriendLabel).toBe(copy.search.addFriend)
    expect(model.onlineHeading).toBe(copy.online.label)
    expect(model.circleHeading).toBe(copy.sections.circle)
    expect(model.incomingHeading).toBe(copy.sections.incoming)
    expect(model.outgoingHeading).toBe(copy.sections.outgoing)
    expect(model.acceptLabel).toBe(copy.row.acceptLabel)
    expect(model.declineLabel).toBe(copy.row.declineLabel)
    expect(model.cancelLabel).toBe(copy.row.cancelLabel)
  })

  it('plumbs inviteCopied and inviteLabel for idle, copied, and failed', () => {
    const idle = buildFriendsScreenModel('ready', context(), actions())
    expect(idle.inviteCopied).toBe(false)
    expect(idle.inviteLabel).toBe(copy.invite.button)

    const copied = buildFriendsScreenModel('ready', context({ copied: true }), actions())
    expect(copied.inviteCopied).toBe(true)
    expect(copied.inviteLabel).toBe(copy.invite.copied)

    const failed = buildFriendsScreenModel('ready', context({ copyFailed: true }), actions())
    expect(failed.inviteCopied).toBe(false)
    expect(failed.inviteLabel).toBe(copy.invite.copyFailed)
  })
})

describe('buildFriendsScreenModel load-error chrome (2.7)', () => {
  it('hides action/online/request chrome and uses authored loadError.body', () => {
    const incoming: FriendEntry = { ...pal, sub: 'in', name: 'In', status: 'incoming' }
    const outgoing: FriendEntry = { ...pal, sub: 'out', name: 'Out', status: 'outgoing' }
    const model = buildFriendsScreenModel(
      'error',
      context({
        friends: [pal, incoming, outgoing],
        onlineSubs: [pal.sub],
        actionErr: 'stale action',
        err: 'raw network',
      }),
      actions(),
    )
    expect(model.showError).toBe(true)
    expect(model.showErr).toBe(false)
    expect(model.showOnline).toBe(false)
    expect(model.showIncoming).toBe(false)
    expect(model.showOutgoing).toBe(false)
    expect(model.errorMessage).toBe(copy.loadError.body)
    expect(model.errorMessage).not.toBe('raw network')
  })
})

describe('buildFriendsScreenModel presence', () => {
  it('marks accepted rows isOnline from onlineSubs and fills the online strip', () => {
    const offline = buildFriendsScreenModel('ready', context({ friends: [pal] }), actions())
    const online = buildFriendsScreenModel(
      'ready',
      context({ friends: [pal], onlineSubs: [pal.sub] }),
      actions(),
    )
    expect(offline.accepted[0]?.isOnline).toBe(false)
    expect(offline.showOnline).toBe(false)
    expect(online.accepted[0]?.isOnline).toBe(true)
    expect(online.showOnline).toBe(true)
    expect(online.onlineFriends).toEqual([buildFriendLinkModel(pal)])
  })
})
