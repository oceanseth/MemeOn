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

  /* the role ladder is named, not t-shirt sized, so `text-display` has to be registered as a font
     size — otherwise cn files it under text colour and `text-foreground` deletes it */
  it('merges the type ladder as font sizes, not colours', () => {
    expect(cn('text-display', 'text-title')).toBe('text-title')
    expect(cn('text-foreground', 'text-body')).toBe('text-foreground text-body')
    expect(cn('text-label', 'text-muted-foreground')).toBe('text-label text-muted-foreground')
    expect(cn('text-small', 'text-intro')).toBe('text-intro')
    expect(cn('text-display-phone', 'text-foreground', 'md:text-display')).toBe(
      'text-display-phone text-foreground md:text-display',
    )
    expect(cn('text-section-phone', 'md:text-section')).toBe('text-section-phone md:text-section')
    expect(cn('text-caption', 'text-muted-foreground')).toBe('text-caption text-muted-foreground')
    expect(cn('text-glyph', 'text-glyph-lg')).toBe('text-glyph-lg')
    expect(cn('text-glyph-sm', 'text-primary-foreground')).toBe('text-glyph-sm text-primary-foreground')
  })

  it('merges the display trackings against each other', () => {
    expect(cn('tracking-display', 'tracking-title')).toBe('tracking-title')
    expect(cn('tracking-card-title', 'md:tracking-title')).toBe('tracking-card-title md:tracking-title')
  })

  it('merges inside the project breakpoint variants', () => {
    expect(cn('max-lg:hidden', 'max-lg:flex')).toBe('max-lg:flex')
    expect(cn('max-xs:p-2', 'max-xs:p-4')).toBe('max-xs:p-4')
    expect(cn('2xl:rounded-lg', '2xl:rounded-full')).toBe('2xl:rounded-full')
  })

  it('keeps utilities that only differ by variant', () => {
    expect(cn('rounded-lg', 'max-lg:rounded-full')).toBe('rounded-lg max-lg:rounded-full')
    expect(cn('text-display', 'max-md:text-display-phone')).toBe('text-display max-md:text-display-phone')
  })

  /* the custom utilities index.css declares have no conflict group: cn passes them through, so a
     component composes one material and never stacks two */
  it('passes the material and focus utilities through untouched', () => {
    expect(cn('material-card', 'focus-ring', 'bg-card')).toBe('material-card focus-ring bg-card')
  })
})
