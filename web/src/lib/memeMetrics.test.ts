import { describe, expect, it } from 'vitest'
import { memeReshareCount, memeViewCount } from './memeMetrics'

describe('memeViewCount', () => {
  it('returns views when the record carries them', () => {
    expect(memeViewCount({ views: 12, reshares: 3 })).toBe(12)
    expect(memeViewCount({ views: 0, reshares: 3 })).toBe(0)
  })

  it('falls back to the legacy load-counter name, not uniqueRefs', () => {
    expect(memeViewCount({ reshares: 3 })).toBe(3)
    expect(memeViewCount({ reshares: 8 })).toBe(8)
  })
})

describe('memeReshareCount', () => {
  it('returns uniqueRefs when present, including zero', () => {
    expect(memeReshareCount({ reshareCount: 4 })).toBe(4)
    expect(memeReshareCount({ reshareCount: 0 })).toBe(0)
  })

  it('is 0 when uniqueRefs is missing — never the view counter', () => {
    expect(memeReshareCount({})).toBe(0)
  })
})
