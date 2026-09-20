import { afterEach, describe, expect, it, vi } from 'vitest'
import { withViewTransition } from './viewTransition'

/* the unit project runs in node: `document` and `matchMedia` are stubbed per case and removed after */
const scope = globalThis as { document?: unknown; matchMedia?: unknown }

afterEach(() => {
  delete scope.document
  delete scope.matchMedia
})

function stub({
  start,
  reduce,
}: {
  start?: ((cb: () => void) => unknown) | undefined
  reduce: boolean
}) {
  scope.document = start ? { startViewTransition: start } : {}
  scope.matchMedia = (query: string) => ({ matches: reduce, media: query })
}

describe('withViewTransition', () => {
  it('runs the update plainly with no document at all', () => {
    const update = vi.fn()
    withViewTransition(update)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('runs the update plainly when the browser has no view transitions', () => {
    stub({ reduce: false })
    const update = vi.fn()
    withViewTransition(update)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('hands the update to startViewTransition when it exists', () => {
    const start = vi.fn((cb: () => void) => cb())
    stub({ start, reduce: false })
    const update = vi.fn()
    withViewTransition(update)
    expect(start).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('skips the transition under reduced motion', () => {
    const start = vi.fn((cb: () => void) => cb())
    stub({ start, reduce: true })
    const update = vi.fn()
    withViewTransition(update)
    expect(start).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
  })
})
