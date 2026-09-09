import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('lets the later Tailwind utility win a conflict', () => {
    expect(cn('p-2 text-text', 'p-4')).toBe('text-text p-4')
  })

  /* the @theme namespaces tailwind-merge cannot infer from the CSS; without the extendTailwindMerge
     config in cn.ts each of these keeps both classes and source-scan order picks the winner */
  it('merges the project container measure against a stock one', () => {
    expect(cn('max-w-page', 'max-w-sm')).toBe('max-w-sm')
    expect(cn('max-w-sm', 'max-w-page')).toBe('max-w-page')
  })

  it('merges the project radii against each other and against stock ones', () => {
    expect(cn('rounded-card', 'rounded-pill')).toBe('rounded-pill')
    expect(cn('rounded-control', 'rounded-lg')).toBe('rounded-lg')
    expect(cn('rounded-lg', 'rounded-control')).toBe('rounded-control')
  })

  it('merges the project shadows and keeps a shadow colour beside them', () => {
    expect(cn('shadow-pop', 'shadow-modal')).toBe('shadow-modal')
    expect(cn('shadow-md', 'shadow-pop')).toBe('shadow-pop')
    expect(cn('shadow-pop', 'shadow-accent')).toBe('shadow-pop shadow-accent')
  })

  it('merges the h1/h2 type ladder', () => {
    expect(cn('text-xl', 'text-2xl')).toBe('text-2xl')
    expect(cn('text-text', 'text-2xl')).toBe('text-text text-2xl')
  })

  it('merges inside the project breakpoint variants', () => {
    expect(cn('max-lg:hidden', 'max-lg:flex')).toBe('max-lg:flex')
    expect(cn('max-xs:p-2', 'max-xs:p-4')).toBe('max-xs:p-4')
    expect(cn('4xl:rounded-card', '4xl:rounded-pill')).toBe('4xl:rounded-pill')
  })

  it('keeps utilities that only differ by variant', () => {
    expect(cn('rounded-card', 'max-lg:rounded-pill')).toBe('rounded-card max-lg:rounded-pill')
  })
})
