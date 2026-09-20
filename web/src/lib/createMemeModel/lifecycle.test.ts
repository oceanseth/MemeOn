import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubSessionStorage } from '../../test/runtime'
import { POLL_TIMEOUT_MS } from '../createMemeVideoPoll'
import { PENDING_VIDEO_KEY } from '../sessionBus'
import {
  DRAFT_PERSIST_MS,
  clearPendingVideoIfOwned,
  createDraftPersister,
  draftOf,
  parsePendingVideo,
  pendingVideoMatchesRemix,
  pendingVideoRecord,
  persistPendingVideo,
  takePendingVideoRestore,
  writePendingVideo,
} from './lifecycle'
import { baseCreateMemeContext as baseCtx } from './testContext'

function rawOf(): string | null {
  return sessionStorage.getItem(PENDING_VIDEO_KEY)
}

describe('parsePendingVideo', () => {
  it('returns null for missing or empty raw', () => {
    expect(parsePendingVideo(null)).toBeNull()
    expect(parsePendingVideo('')).toBeNull()
  })

  it('returns malformed for JSON throw, non-objects, and invalid required fields', () => {
    expect(parsePendingVideo('{')).toBe('malformed')
    expect(parsePendingVideo('[]')).toBe('malformed')
    expect(parsePendingVideo('1')).toBe('malformed')
    expect(parsePendingVideo('"x"')).toBe('malformed')
    expect(parsePendingVideo('null')).toBe('malformed')
    expect(parsePendingVideo(JSON.stringify({ startedAt: 1 }))).toBe('malformed')
    expect(parsePendingVideo(JSON.stringify({ generationId: '', startedAt: 1 }))).toBe('malformed')
    expect(parsePendingVideo(JSON.stringify({ generationId: 'g', startedAt: '1' }))).toBe('malformed')
    expect(parsePendingVideo(JSON.stringify({ generationId: 'g', startedAt: Number.NaN }))).toBe(
      'malformed',
    )
  })

  it('accepts generationId + startedAt with optional draft and imageUrl', () => {
    expect(parsePendingVideo(JSON.stringify({ generationId: 'g', startedAt: 10 }))).toEqual({
      generationId: 'g',
      startedAt: 10,
      remixId: null,
    })
    expect(
      parsePendingVideo(
        JSON.stringify({
          generationId: 'g',
          startedAt: 10,
          imageUrl: '/a.png',
          remixId: 'remix-a',
          draft: { title: 't' },
        }),
      ),
    ).toMatchObject({
      generationId: 'g',
      startedAt: 10,
      imageUrl: '/a.png',
      remixId: 'remix-a',
      draft: { title: 't' },
    })
  })
})

describe('pendingVideoMatchesRemix', () => {
  it('resumes a pending remix only from the route that started it', () => {
    expect(pendingVideoMatchesRemix('remix-a', 'remix-b')).toBe(false)
    expect(pendingVideoMatchesRemix('remix-a', 'remix-a')).toBe(true)
  })

  it('keeps non-remix video jobs resumable from the non-remix route', () => {
    expect(pendingVideoMatchesRemix(null, 'remix-a')).toBe(false)
    expect(pendingVideoMatchesRemix(undefined, null)).toBe(true)
    expect(pendingVideoMatchesRemix(null, null)).toBe(true)
  })
})

describe('pending video storage policy', () => {
  beforeEach(() => {
    stubSessionStorage()
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('takePendingVideoRestore is none when storage is empty', () => {
    expect(takePendingVideoRestore(null, 1_000)).toEqual({ kind: 'none' })
  })

  it('clears expiry and malformed, and leaves a remix mismatch', () => {
    writePendingVideo({ generationId: 'g', startedAt: 1, remixId: 'remix-a' })
    expect(takePendingVideoRestore('remix-a', 1 + POLL_TIMEOUT_MS + 1)).toEqual({ kind: 'cleared' })
    expect(rawOf()).toBeNull()

    sessionStorage.setItem(PENDING_VIDEO_KEY, '{not-json')
    expect(takePendingVideoRestore(null, 1_000)).toEqual({ kind: 'cleared' })
    expect(rawOf()).toBeNull()

    writePendingVideo({ generationId: 'g', startedAt: 50, remixId: 'remix-a', imageUrl: '/a.png' })
    expect(takePendingVideoRestore('remix-b', 50)).toEqual({ kind: 'mismatch' })
    expect(rawOf()).toContain('remix-a')
  })

  it('match resume leaves the record', () => {
    const record = { generationId: 'g', startedAt: 50, remixId: 'remix-a', imageUrl: '/a.png' }
    writePendingVideo(record)
    expect(takePendingVideoRestore('remix-a', 50)).toEqual({ kind: 'resume', record })
    expect(rawOf()).toContain('remix-a')
  })

  it('persistDraft no-ops without a record and does not clear malformed', () => {
    vi.useFakeTimers()
    const persister = createDraftPersister(() => baseCtx)
    persister.schedule()
    vi.advanceTimersByTime(DRAFT_PERSIST_MS)
    expect(rawOf()).toBeNull()

    sessionStorage.setItem(PENDING_VIDEO_KEY, '{not-json')
    persister.schedule()
    vi.advanceTimersByTime(DRAFT_PERSIST_MS)
    expect(rawOf()).toBe('{not-json')
    persister.dispose()
  })

  it('persistDraft RMW writes draftOf(getCtx()) only', () => {
    vi.useFakeTimers()
    writePendingVideo({
      generationId: 'g',
      startedAt: 9,
      remixId: null,
      imageUrl: '/a.png',
      draft: draftOf({ ...baseCtx, title: 'old' }),
    })
    const persister = createDraftPersister(() => ({ ...baseCtx, title: 'new title' }))
    persister.schedule()
    expect(JSON.parse(rawOf()!).draft.title).toBe('old')
    vi.advanceTimersByTime(DRAFT_PERSIST_MS)
    const stored = JSON.parse(rawOf()!)
    expect(stored.generationId).toBe('g')
    expect(stored.startedAt).toBe(9)
    expect(stored.imageUrl).toBe('/a.png')
    expect(stored.draft).toEqual(draftOf({ ...baseCtx, title: 'new title' }))
    persister.dispose()
  })

  it('persistPendingVideo writes the full record', () => {
    persistPendingVideo(baseCtx, 'render-a', 1_700)
    expect(JSON.parse(rawOf()!)).toEqual({
      generationId: 'render-a',
      startedAt: 1_700,
      imageUrl: '/thumb.png',
      remixId: null,
      draft: draftOf(baseCtx),
    })
  })

  it('carries the whole draft in the pending-render record', () => {
    const record = pendingVideoRecord(
      { ...baseCtx, mode: 'video', title: 'burning office', tags: 'chaos', prompt: 'a capybara', imageUrl: '/thumb.png' },
      'render-a',
      1_700_000_000_000,
    )
    expect(record).toMatchObject({ generationId: 'render-a', imageUrl: '/thumb.png' })
    expect(record.draft).toEqual(
      draftOf({ ...baseCtx, mode: 'video', title: 'burning office', tags: 'chaos', prompt: 'a capybara' }),
    )
    expect(record.draft?.title).toBe('burning office')
  })

  it('clearPendingVideoIfOwned removes only a matching generationId and startedAt', () => {
    writePendingVideo({ generationId: 'gen-a', startedAt: 100, remixId: null, imageUrl: '/a.png' })
    clearPendingVideoIfOwned('gen-b', 100)
    expect(rawOf()).not.toBeNull()
    clearPendingVideoIfOwned('gen-a', 100)
    expect(rawOf()).toBeNull()
  })
})
