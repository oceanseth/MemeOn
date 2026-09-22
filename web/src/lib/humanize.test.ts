import { describe, expect, it } from 'vitest'
import { humanize } from './humanize'

describe('humanize', () => {
  it('leaves anything under 1,000 exact', () => {
    expect(humanize(0)).toBe('0')
    expect(humanize(1)).toBe('1')
    expect(humanize(999)).toBe('999')
  })

  it('compacts thousands with one decimal under 10k and whole thousands from there', () => {
    expect(humanize(1000)).toBe('1k')
    expect(humanize(1500)).toBe('1.5k')
    expect(humanize(1949)).toBe('1.9k')
    expect(humanize(1950)).toBe('2k')
    expect(humanize(25182)).toBe('25k')
    expect(humanize(25500)).toBe('26k')
    expect(humanize(250000)).toBe('250k')
    expect(humanize(999499)).toBe('999k')
  })

  it('rolls into millions and billions the same way', () => {
    expect(humanize(999500)).toBe('1m')
    expect(humanize(1_500_000)).toBe('1.5m')
    expect(humanize(9_949_999)).toBe('9.9m')
    expect(humanize(9_950_000)).toBe('10m')
    expect(humanize(12_000_000)).toBe('12m')
    expect(humanize(250_000_000)).toBe('250m')
    expect(humanize(999_500_000)).toBe('1b')
    expect(humanize(1_500_000_000)).toBe('1.5b')
    expect(humanize(12_000_000_000)).toBe('12b')
  })

  it('keeps a minus sign on a negative magnitude', () => {
    expect(humanize(-1500)).toBe('-1.5k')
    expect(humanize(-25182)).toBe('-25k')
  })
})
