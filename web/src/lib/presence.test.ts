import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  onDisconnectRemove: vi.fn(),
  onDisconnect: vi.fn(),
  onValue: vi.fn(),
  ref: vi.fn(),
  remove: vi.fn(),
  set: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

vi.mock('firebase/database', () => ({
  onDisconnect: sdk.onDisconnect,
  onValue: sdk.onValue,
  ref: sdk.ref,
  remove: sdk.remove,
  set: sdk.set,
  serverTimestamp: sdk.serverTimestamp,
}))

vi.mock('./firebase', () => ({ rtdb: { name: 'rtdb' } }))

import { startPresence, watchPresence } from './presence'

type Snap = { val?: () => unknown; exists?: () => boolean }
type Listener = {
  path: string
  success: (snap: Snap) => void
  cancel?: (err: Error) => void
}

let listeners: Listener[]

function listener(path: string): Listener {
  const found = listeners.find((entry) => entry.path === path)
  if (!found) throw new Error(`no onValue listener for ${path}`)
  return found
}

describe('presence', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    listeners = []
    sdk.onDisconnectRemove.mockReset()
    sdk.onDisconnect.mockReset()
    sdk.onValue.mockReset()
    sdk.ref.mockReset()
    sdk.remove.mockReset()
    sdk.set.mockReset()
    sdk.serverTimestamp.mockClear()
    sdk.onDisconnect.mockImplementation(() => ({
      remove: sdk.onDisconnectRemove,
    }))
    sdk.ref.mockImplementation((_db: unknown, path: string) => ({ path }))
    sdk.onValue.mockImplementation(
      (query: { path: string }, success: Listener['success'], cancel?: Listener['cancel']) => {
        const entry: Listener = { path: query.path, success }
        if (cancel !== undefined) entry.cancel = cancel
        listeners.push(entry)
        return vi.fn()
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs advertise failures from onDisconnect/set and does not throw', async () => {
    const disconnectErr = new Error('onDisconnect denied')
    sdk.onDisconnectRemove.mockRejectedValue(disconnectErr)
    expect(() => startPresence('uid-1')).not.toThrow()
    expect(() => listener('.info/connected').success({ val: () => true })).not.toThrow()
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[memeon presence] advertise failed',
        disconnectErr,
      )
    })

    vi.mocked(console.error).mockClear()
    sdk.onDisconnectRemove.mockResolvedValue(undefined)
    const setErr = new Error('set denied')
    sdk.set.mockRejectedValue(setErr)
    listener('.info/connected').success({ val: () => true })
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('[memeon presence] advertise failed', setErr)
    })
  })

  it('logs stop failures and does not throw', async () => {
    const stop = startPresence('uid-1')
    const err = new Error('remove denied')
    sdk.remove.mockRejectedValue(err)
    expect(() => stop()).not.toThrow()
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('[memeon presence] stop failed', err)
    })
  })

  it('logs when the connected listener cancels and does not throw', () => {
    expect(() => startPresence('uid-1')).not.toThrow()
    const err = new Error('connected listener failed')
    expect(() => listener('.info/connected').cancel?.(err)).not.toThrow()
    expect(console.error).toHaveBeenCalledWith('[memeon presence] connected listener failed', err)
  })

  it('logs watch errors and drops that uid', () => {
    const seen: Set<string>[] = []
    const watch = watchPresence((online) => {
      seen.push(online)
    })
    watch.setSubs(['friend-1'])
    const friend = listener('presence/friend-1')
    friend.success({ exists: () => true })
    expect(seen.at(-1)).toEqual(new Set(['friend-1']))

    const err = new Error('permission denied')
    friend.cancel?.(err)
    expect(console.error).toHaveBeenCalledWith('[memeon presence] watch failed', err)
    expect(seen.at(-1)).toEqual(new Set())
  })
})
