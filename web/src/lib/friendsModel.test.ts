import { describe, expect, it, vi } from 'vitest'
import { friendAccepted } from '../../.storybook/fixtures'
import { friendsCopy as copy } from '../copy/friends'
import type { ConfirmDialogModel } from './confirmDialogModel'
import type { GiftDialogModel } from './giftDialogModel'
import {
  buildFriendLinkModel,
  buildFriendsScreenModel,
  type BuildFriendsScreenModelInput,
  type FriendsScreenProjection,
} from './friendsModel'

const giftDialog = { open: false } as GiftDialogModel
const removeDialog = { open: false } as ConfirmDialogModel

const actions: BuildFriendsScreenModelInput['actions'] = {
  onRequest: vi.fn(),
  onRespond: vi.fn(),
  onRemove: vi.fn(),
  onGiftOpen: vi.fn(),
  onAskRemove: vi.fn(),
}

function ctx(overrides: Partial<FriendsScreenProjection> = {}): FriendsScreenProjection {
  return {
    friends: [],
    query: '',
    hits: [],
    msg: null,
    actionErr: null,
    searchErr: null,
    pendingSub: null,
    searching: false,
    onlineSubs: [],
    copied: false,
    copyFailed: false,
    err: null,
    ...overrides,
  }
}

function model(overrides: Partial<FriendsScreenProjection> & { phase?: BuildFriendsScreenModelInput['phase'] } = {}) {
  const { phase = 'ready', ...projection } = overrides
  return buildFriendsScreenModel({
    phase,
    ctx: ctx(projection),
    searchInputProps: {
      value: projection.query ?? '',
      onChange: vi.fn(),
      'aria-label': copy.search.inputLabel,
      placeholder: copy.search.placeholder,
    },
    inviteButtonProps: { onClick: vi.fn() },
    retryButtonProps: { onClick: vi.fn() },
    emptyActionProps: { onClick: vi.fn() },
    giftDialog,
    removeDialog,
    actions,
  })
}

const palHit = { sub: 'pal', name: 'Pal', picture: '/pal.png' }

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

describe('friends search show* flags', () => {
  it('showSearching only when the panel is open, a search is in flight, and hits are empty', () => {
    const searching = model({ query: 'pal', searching: true, hits: [] })
    expect(searching.showSearchPanel).toBe(true)
    expect(searching.showSearching).toBe(true)
    expect(searching.showHits).toBe(false)
    expect(searching.showNoHits).toBe(false)
    expect(searching.showSearchFailed).toBe(false)

    const withHits = model({ query: 'pal', searching: true, hits: [palHit] })
    expect(withHits.showSearching).toBe(false)
    expect(withHits.showHits).toBe(true)
  })

  it('showHits when the panel has hits and no searchErr', () => {
    const hits = model({ query: 'pal', searching: false, hits: [palHit] })
    expect(hits.showHits).toBe(true)
    expect(hits.showNoHits).toBe(false)
    expect(hits.showSearchFailed).toBe(false)
    expect(hits.showSearching).toBe(false)
  })

  it('showNoHits when the panel finished empty without searchErr', () => {
    const noHits = model({ query: 'pal', searching: false, hits: [] })
    expect(noHits.showNoHits).toBe(true)
    expect(noHits.showHits).toBe(false)
    expect(noHits.showSearchFailed).toBe(false)
    expect(noHits.noHitsMessage).toBe(copy.search.noHits('pal'))
  })

  it('showSearchFailed when GET /api/users failed — not noHits, even if hits linger', () => {
    const failed = model({
      query: 'pal',
      searching: false,
      hits: [],
      searchErr: copy.search.failed,
    })
    expect(failed.showSearchFailed).toBe(true)
    expect(failed.showNoHits).toBe(false)
    expect(failed.showHits).toBe(false)
    expect(failed.showSearching).toBe(false)
    expect(failed.searchFailedMessage).toBe(copy.search.failed)

    const failedWithStaleHits = model({
      query: 'pal',
      searching: false,
      hits: [palHit],
      searchErr: copy.search.failed,
    })
    expect(failedWithStaleHits.showHits).toBe(false)
    expect(failedWithStaleHits.showSearchFailed).toBe(true)
    expect(failedWithStaleHits.showNoHits).toBe(false)
  })

  it('does not change showError / showEmpty from the load phase', () => {
    expect(model({ phase: 'error' }).showError).toBe(true)
    expect(model({ phase: 'error' }).showEmpty).toBe(false)
    expect(model({ phase: 'empty' }).showEmpty).toBe(true)
    expect(model({ phase: 'empty' }).showError).toBe(false)
  })

  it('projects leftover section copy from friendsCopy', () => {
    const ready = model()
    expect(ready.pageTitle).toBe(copy.pageTitle)
    expect(ready.searchResultsHeading).toBe(copy.search.resultsHeading)
    expect(ready.addFriendLabel).toBe(copy.search.addFriend)
    expect(ready.onlineHeading).toBe(copy.online.label)
    expect(ready.circleHeading).toBe(copy.sections.circle)
    expect(ready.incomingHeading).toBe(copy.sections.incoming)
    expect(ready.outgoingHeading).toBe(copy.sections.outgoing)
    expect(ready.acceptLabel).toBe(copy.row.acceptLabel)
    expect(ready.declineLabel).toBe(copy.row.declineLabel)
    expect(ready.cancelLabel).toBe(copy.row.cancelLabel)
  })
})

describe('accepted isOnline from onlineSubs', () => {
  it('marks accepted rows online only when their sub is in onlineSubs', () => {
    const online = model({
      friends: [friendAccepted],
      onlineSubs: [friendAccepted.sub],
    })
    expect(online.accepted).toHaveLength(1)
    expect(online.accepted[0]!.isOnline).toBe(true)
    expect(online.showOnline).toBe(true)
    expect(online.onlineFriends.map((friend) => friend.sub)).toEqual([friendAccepted.sub])

    const offline = model({
      friends: [friendAccepted],
      onlineSubs: [],
    })
    expect(offline.accepted[0]!.isOnline).toBe(false)
    expect(offline.showOnline).toBe(false)
  })
})
