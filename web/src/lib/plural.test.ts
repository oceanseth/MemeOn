import { describe, expect, it } from 'vitest'
import { plural, pluralWord } from './plural'

describe('plural', () => {
  it('agrees with the figure beside it, including the real single-count case', () => {
    expect(pluralWord(1, 'reshare')).toBe('reshare')
    expect(pluralWord(0, 'reshare')).toBe('reshares')
    expect(pluralWord(2, 'view')).toBe('views')
  })

  it('formats large real counts with separators', () => {
    expect(plural(1, 'view')).toBe('1 view')
    expect(plural(1507, 'view')).toBe('1,507 views')
    expect(plural(0, 'view')).toBe('0 views')
  })
})
