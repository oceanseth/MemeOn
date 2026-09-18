import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('lets the later Tailwind utility win a conflict', () => {
    expect(cn('p-2 text-foreground', 'p-4')).toBe('text-foreground p-4')
  })

  /* the one @theme namespace cn cannot infer from the CSS; without the extend block in cn.ts
     `max-w-card-narrow` keeps its partner and source-scan order picks the winner */
  it('merges the one surviving container against the stock widths', () => {
    expect(cn('max-w-full', 'max-w-card-narrow')).toBe('max-w-card-narrow')
    expect(cn('max-w-card-narrow', 'max-w-full')).toBe('max-w-full')
  })

  /* lengths are grid steps now, so cn's own validators own every one of them; these are the
     regressions that would come back if a length ever grew a role name again */
  it('merges the lengths as grid steps', () => {
    expect(cn('max-w-140', 'max-w-135')).toBe('max-w-135')
    expect(cn('max-w-[65ch]', 'max-w-140')).toBe('max-w-140')
    expect(cn('max-w-92.5', 'max-w-full')).toBe('max-w-full')
    expect(cn('h-11.5', 'h-11')).toBe('h-11')
    expect(cn('h-11', 'h-11.5')).toBe('h-11.5')
    expect(cn('min-h-11', 'min-h-11')).toBe('min-h-11')
    expect(cn('h-11.5', 'min-h-11.5')).toBe('h-11.5 min-h-11.5')
    expect(cn('px-4', 'px-5')).toBe('px-5')
    expect(cn('px-5', 'px-4.5')).toBe('px-4.5')
    expect(cn('p-6', 'max-md:p-4.5')).toBe('p-6 max-md:p-4.5')
    expect(cn('size-8', 'size-5.5')).toBe('size-5.5')
    expect(cn('size-8.5', 'size-11')).toBe('size-11')
    expect(cn('-mx-5', '-mx-5')).toBe('-mx-5')
    expect(cn('p-7.5', '-m-7.5')).toBe('p-7.5 -m-7.5')
    expect(cn('h-2', 'h-1.5')).toBe('h-1.5')
    expect(cn('-inset-1', '-inset-1.25')).toBe('-inset-1.25')
    expect(cn('mb-4.5', 'mb-0')).toBe('mb-0')
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
