import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackDialogOpener } from './dialogOpener'

/** The one thing this module reads, stubbed: these tests run in node, where there is no document. */
const body = { nodeName: 'BODY' }
const focusOn = (active: unknown) => vi.stubGlobal('document', { activeElement: active, body })
const focusable = () => ({ focus: () => {}, isConnected: true }) as unknown as HTMLElement

afterEach(() => vi.unstubAllGlobals())

describe('trackDialogOpener', () => {
  it('records the focused element once, and keeps it while the dialog stays open', () => {
    const opener = focusable()
    focusOn(opener)
    const recorded = trackDialogOpener('once', true)
    expect(recorded?.current).toBe(opener)

    // by the second build focus is inside the popup: re-reading it would lose the opener
    focusOn(focusable())
    expect(trackDialogOpener('once', true)).toBe(recorded)
    expect(recorded?.current).toBe(opener)
  })

  it('forgets the opener on close, so the next open records the next one', () => {
    const first = focusable()
    focusOn(first)
    expect(trackDialogOpener('cycle', true)?.current).toBe(first)

    expect(trackDialogOpener('cycle', false)).toBeUndefined()

    const second = focusable()
    focusOn(second)
    expect(trackDialogOpener('cycle', true)?.current).toBe(second)
  })

  it('reads the opener at close time, so a dialog that outlived it asks for nothing', () => {
    const opener = focusable()
    focusOn(opener)
    const recorded = trackDialogOpener('stale', true)
    expect(recorded?.current).toBe(opener)

    // Base UI falls back to its own restore rather than focusing a detached node
    Object.assign(opener, { isConnected: false })
    expect(recorded?.current).toBeNull()
  })

  it('hands back nothing when the page itself holds focus, or when there is no page', () => {
    focusOn(body)
    expect(trackDialogOpener('page', true)).toBeUndefined()

    // not an element that can take focus back
    focusOn({ nodeName: '#text' })
    expect(trackDialogOpener('text', true)).toBeUndefined()

    vi.stubGlobal('document', undefined)
    expect(trackDialogOpener('ssr', true)).toBeUndefined()
  })
})
