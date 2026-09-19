import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../copy/createMeme'
import { PENDING_VIDEO_KEY } from './sessionBus'
import {
  cancelVideoPollForOwner,
  CreationLifetimeCancelledError,
  isLifetimeCancellation,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  pollVideoStatus,
  type VideoPollRun,
} from './createMemeVideoPoll'

const copy = createMemeCopy

function stubSessionStorage(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function persistOwned(generationId: string, startedAt: number): void {
  sessionStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify({ generationId, startedAt }))
}

describe('pollVideoStatus', () => {
  let pollRunRef: { current: VideoPollRun | null }

  beforeEach(() => {
    pollRunRef = { current: null }
    stubSessionStorage()
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('resolves when the status becomes video', async () => {
    const owner = { active: true }
    const fetchStatus = vi.fn().mockResolvedValue({ status: 'video', videoUrl: '/done.mp4' })

    const result = pollVideoStatus(pollRunRef, 'gen-1', Date.now(), owner, persistOwned, { fetchStatus })
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await expect(result).resolves.toBe('/done.mp4')
    expect(fetchStatus).toHaveBeenCalledWith('gen-1')
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBeNull()
  })

  it('rejects on error status with the server message and clears if owned', async () => {
    const owner = { active: true }
    const fetchStatus = vi.fn().mockResolvedValue({ status: 'error', errorMessage: 'Masky blew up' })

    const result = pollVideoStatus(pollRunRef, 'gen-1', Date.now(), owner, persistOwned, { fetchStatus })
    const settled = expect(result).rejects.toThrow('Masky blew up')
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await settled
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBeNull()
  })

  it('times out after POLL_TIMEOUT_MS and clears if owned', async () => {
    const startedAt = 1_000
    const owner = { active: true }
    const fetchStatus = vi.fn().mockResolvedValue({ status: 'processing' })

    const result = pollVideoStatus(pollRunRef, 'gen-timeout', startedAt, owner, persistOwned, {
      fetchStatus,
      now: () => startedAt + POLL_TIMEOUT_MS + 1,
    })
    const settled = expect(result).rejects.toThrow(copy.errors.stillRendering('gen-timeout'))
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await settled
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBeNull()
  })

  it('cancels the previous run when a newer poll starts', async () => {
    const owner = { active: true }
    const fetchStatus = vi.fn().mockResolvedValue({ status: 'video', videoUrl: '/second.mp4' })

    const firstResult = pollVideoStatus(pollRunRef, 'gen-a', Date.now(), owner, () => {}, { fetchStatus })
    const secondResult = pollVideoStatus(pollRunRef, 'gen-b', Date.now(), owner, () => {}, { fetchStatus })
    await expect(firstResult).rejects.toBeInstanceOf(CreationLifetimeCancelledError)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await expect(secondResult).resolves.toBe('/second.mp4')
    expect(fetchStatus).toHaveBeenCalledWith('gen-b')
    expect(fetchStatus).not.toHaveBeenCalledWith('gen-a')
  })

  it('ignores transient fetch failures until timeout', async () => {
    const owner = { active: true }
    const fetchStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValue({ status: 'video', videoUrl: '/recovered.mp4' })

    const result = pollVideoStatus(pollRunRef, 'gen-1', Date.now(), owner, () => {}, { fetchStatus })
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    await expect(result).resolves.toBe('/recovered.mp4')
    expect(fetchStatus).toHaveBeenCalledTimes(2)
  })

  it('rejects immediately when the owner is already inactive', async () => {
    const owner = { active: false }
    await expect(
      pollVideoStatus(pollRunRef, 'gen-1', Date.now(), owner, () => {}, { fetchStatus: vi.fn() }),
    ).rejects.toBeInstanceOf(CreationLifetimeCancelledError)
  })

  it('cancelVideoPollForOwner rejects an in-flight poll and leaves the record', async () => {
    const owner = { active: true }
    const status = deferred<{ status: string }>()

    const result = pollVideoStatus(pollRunRef, 'gen-1', Date.now(), owner, persistOwned, {
      fetchStatus: () => status.promise,
    })
    const settled = expect(result).rejects.toBeInstanceOf(CreationLifetimeCancelledError)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('gen-1')
    cancelVideoPollForOwner(pollRunRef, owner)
    await settled
    expect(isLifetimeCancellation(new CreationLifetimeCancelledError())).toBe(true)
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('gen-1')
  })
})
