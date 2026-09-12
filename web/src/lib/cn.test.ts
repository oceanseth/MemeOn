import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins conditional class lists', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('lets the later Tailwind utility win a conflict', () => {
    expect(cn('p-2 text-ink', 'p-4')).toBe('text-ink p-4')
  })

  /* the @theme namespaces tailwind-merge cannot infer from the CSS; without the extendTailwindMerge
     config in cn.ts each of these keeps both classes and source-scan order picks the winner */
  it('merges the project container measure against a stock one', () => {
    expect(cn('max-w-app', 'max-w-sm')).toBe('max-w-sm')
    expect(cn('max-w-sm', 'max-w-app')).toBe('max-w-app')
  })

  it('merges the project radii against each other and against stock ones', () => {
    expect(cn('rounded-card', 'rounded-pill')).toBe('rounded-pill')
    expect(cn('rounded-control', 'rounded-lg')).toBe('rounded-lg')
    expect(cn('rounded-lg', 'rounded-control')).toBe('rounded-control')
    expect(cn('rounded-field', 'rounded-chip')).toBe('rounded-chip')
    expect(cn('rounded-nav', 'rounded-avatar')).toBe('rounded-avatar')
    expect(cn('rounded-shell', 'rounded-tabbar')).toBe('rounded-tabbar')
    expect(cn('rounded-tabbar', 'rounded-full')).toBe('rounded-full')
  })

  it('merges the project shadows and keeps a shadow colour beside them', () => {
    expect(cn('shadow-pop', 'shadow-modal')).toBe('shadow-modal')
    expect(cn('shadow-md', 'shadow-pop')).toBe('shadow-pop')
    expect(cn('shadow-pop', 'shadow-link')).toBe('shadow-pop shadow-link')
    expect(cn('shadow-raised', 'shadow-pressed')).toBe('shadow-pressed')
    expect(cn('shadow-pressed', 'shadow-raised')).toBe('shadow-raised')
    expect(cn('shadow-raised', 'shadow-none')).toBe('shadow-none')
  })

  /* the Soft Press ladder is named, not t-shirt sized, so `text-display` has to be registered as a
     font size — otherwise tailwind-merge files it under text colour and `text-ink` deletes it */
  it('merges the type ladder as font sizes, not colours', () => {
    expect(cn('text-display', 'text-title')).toBe('text-title')
    expect(cn('text-lg', 'text-card-title')).toBe('text-card-title')
    expect(cn('text-micro', 'text-sm')).toBe('text-sm')
    expect(cn('text-ink', 'text-body')).toBe('text-ink text-body')
    expect(cn('text-label', 'text-ink-muted')).toBe('text-label text-ink-muted')
    expect(cn('text-small', 'text-intro')).toBe('text-intro')
    expect(cn('text-hero-phone', 'text-ink', 'md:text-hero')).toBe('text-hero-phone text-ink md:text-hero')
    expect(cn('text-section-phone', 'text-ink', 'md:text-section')).toBe(
      'text-section-phone text-ink md:text-section',
    )
    expect(cn('text-caption', 'text-ink-muted')).toBe('text-caption text-ink-muted')
  })

  it('merges the display trackings against each other and a stock one', () => {
    expect(cn('tracking-display', 'tracking-title')).toBe('tracking-title')
    expect(cn('tracking-tight', 'tracking-card-title')).toBe('tracking-card-title')
    expect(cn('tracking-display', 'tracking-normal')).toBe('tracking-normal')
    expect(cn('tracking-ui', 'tracking-display')).toBe('tracking-display')
    expect(cn('tracking-card-title', 'md:tracking-title')).toBe('tracking-card-title md:tracking-title')
  })

  it('merges the stock type sizes', () => {
    expect(cn('text-xl', 'text-2xl')).toBe('text-2xl')
    expect(cn('text-ink', 'text-2xl')).toBe('text-ink text-2xl')
  })

  it('merges inside the project breakpoint variants', () => {
    expect(cn('max-lg:hidden', 'max-lg:flex')).toBe('max-lg:flex')
    expect(cn('max-xs:p-2', 'max-xs:p-4')).toBe('max-xs:p-4')
    expect(cn('4xl:rounded-card', '4xl:rounded-pill')).toBe('4xl:rounded-pill')
  })

  it('keeps utilities that only differ by variant', () => {
    expect(cn('rounded-card', 'max-lg:rounded-pill')).toBe('rounded-card max-lg:rounded-pill')
    expect(cn('text-display', 'max-md:text-display-phone')).toBe('text-display max-md:text-display-phone')
  })

  /* Why `atoms/Button.tsx` spells its baseline line-height as an arbitrary property. `font-size`
     and `leading` share one conflict group, so a caller's `text-*` deletes a `leading-*` that
     sorts before it — which silently made every `text-xs` button preflight-tall. The
     arbitrary-property group does not conflict with `text-*`, and another `[line-height:…]`
     still overrides it. */
  it('keeps an arbitrary line-height through a caller font size, unlike leading-[…]', () => {
    expect(cn('leading-[normal]', 'text-xs')).toBe('text-xs')
    expect(cn('[line-height:normal]', 'text-xs')).toBe('[line-height:normal] text-xs')
    expect(cn('[line-height:normal]', 'text-[17px]')).toBe('[line-height:normal] text-[17px]')
    expect(cn('[line-height:normal]', '[line-height:1.125]')).toBe('[line-height:1.125]')
  })
})
