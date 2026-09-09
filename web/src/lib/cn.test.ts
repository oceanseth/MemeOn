import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('lets the later Tailwind utility win a conflict', () => {
    expect(cn('p-2 text-text', 'p-4')).toBe('text-text p-4')
  })
})
