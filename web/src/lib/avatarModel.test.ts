import { describe, expect, it } from 'vitest'
import { sharedCopy } from '../copy/shared'
import { avatarInitial } from './avatarModel'

describe('avatar model', () => {
  it('reads the first grapheme of a real display name, and never renders an empty disc', () => {
    expect(avatarInitial('Issam Misto')).toBe('I')
    expect(avatarInitial('  pushrax ')).toBe('P')
    expect(avatarInitial('')).toBe(sharedCopy.avatarFallback)
    // a non-letter lead survives the uppercase pass — a plain symbol, no emoji
    expect(avatarInitial(' @bandname ')).toBe('@')
  })
})
