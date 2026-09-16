import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('lets the later Tailwind utility win a conflict', () => {
    expect(cn('p-2 text-foreground', 'p-4')).toBe('text-foreground p-4')
  })

  /* the @theme namespaces cn cannot infer from the CSS; without the extend block in cn.ts each of
     these keeps both classes and source-scan order picks the winner */
  it('merges the container widths against each other and against stock ones', () => {
    expect(cn('max-w-card', 'max-w-search')).toBe('max-w-search')
    expect(cn('max-w-measure', 'max-w-card')).toBe('max-w-card')
    expect(cn('max-w-tabbar', 'max-w-full')).toBe('max-w-full')
    expect(cn('max-w-full', 'max-w-card-narrow')).toBe('max-w-card-narrow')
  })

  it('merges the named spacing roles against the numeric grid and each other', () => {
    expect(cn('h-control', 'h-11')).toBe('h-11')
    expect(cn('h-11', 'h-control')).toBe('h-control')
    expect(cn('min-h-11', 'min-h-hit')).toBe('min-h-hit')
    expect(cn('h-control', 'min-h-control')).toBe('h-control min-h-control')
    expect(cn('px-4', 'px-page-x')).toBe('px-page-x')
    expect(cn('px-page-x', 'px-gutter')).toBe('px-gutter')
    expect(cn('p-card-inset', 'max-md:p-gutter')).toBe('p-card-inset max-md:p-gutter')
    expect(cn('size-8', 'size-icon')).toBe('size-icon')
    expect(cn('size-control-sm', 'size-hit')).toBe('size-hit')
    expect(cn('-mx-5', '-mx-page-x')).toBe('-mx-page-x')
    expect(cn('p-bloom', '-m-bloom')).toBe('p-bloom -m-bloom')
    expect(cn('h-2', 'h-track')).toBe('h-track')
    expect(cn('-inset-1', '-inset-halo')).toBe('-inset-halo')
    expect(cn('mb-gutter', 'mb-0')).toBe('mb-0')
  })

  /* the scale is the stock t-shirt ladder now, so cn's own font-size validator owns it; these are
     the regressions that would come back if a step ever grew a role name again */
  it('merges the type ladder as font sizes, not colours', () => {
    expect(cn('text-5xl', 'text-3xl')).toBe('text-3xl')
    expect(cn('text-foreground', 'text-base')).toBe('text-foreground text-base')
    expect(cn('text-base', 'text-muted-foreground')).toBe('text-base text-muted-foreground')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('text-4xl', 'text-foreground', 'md:text-5xl')).toBe(
      'text-4xl text-foreground md:text-5xl',
    )
    expect(cn('text-2xl', 'md:text-4xl')).toBe('text-2xl md:text-4xl')
    expect(cn('text-sm', 'text-muted-foreground')).toBe('text-sm text-muted-foreground')
    expect(cn('text-xl leading-none', 'text-2xl leading-none')).toBe('text-2xl leading-none')
    expect(cn('text-base leading-none', 'text-primary-foreground')).toBe('text-base leading-none text-primary-foreground')
  })

  it('merges the stock trackings against each other', () => {
    expect(cn('tracking-tighter', 'tracking-tight')).toBe('tracking-tight')
    expect(cn('tracking-normal', 'md:tracking-wider')).toBe('tracking-normal md:tracking-wider')
  })

  it('merges inside the project breakpoint variants', () => {
    expect(cn('max-lg:hidden', 'max-lg:flex')).toBe('max-lg:flex')
    expect(cn('max-xs:p-2', 'max-xs:p-4')).toBe('max-xs:p-4')
    expect(cn('2xl:rounded-lg', '2xl:rounded-full')).toBe('2xl:rounded-full')
  })

  it('keeps utilities that only differ by variant', () => {
    expect(cn('rounded-lg', 'max-lg:rounded-full')).toBe('rounded-lg max-lg:rounded-full')
    expect(cn('text-5xl', 'max-md:text-4xl')).toBe('text-5xl max-md:text-4xl')
  })

  /* the materials are one axis — one fill + relief per element — so the later one wins by merge
     rather than by where it happens to sort in the built sheet */
  it('merges the materials against each other and passes the rest through', () => {
    expect(cn('material-pressed', 'material-raised')).toBe('material-raised')
    expect(cn('material-card', 'aria-pressed:material-pressed')).toBe('material-card aria-pressed:material-pressed')
    expect(cn('material-card', 'focus-ring', 'bg-card')).toBe('material-card focus-ring bg-card')
    /* `glass` is a plate, not a material: `material-raised glass` is a real pair (hero-video) */
    expect(cn('material-raised', 'glass')).toBe('material-raised glass')
  })
})
