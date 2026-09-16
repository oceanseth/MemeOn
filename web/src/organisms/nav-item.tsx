import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * The shell's navigation rows. Each was an exported class string on `AppShell`; as components the
 * lint can see them, the current page is a prop rather than a hand-written `aria-current`, and a
 * screen never spells the chrome again.
 *
 * All four render an `<a>` by default and take a router link through `render` — a navigation
 * target is a link, so none of them is a `Button` (shadcn's "as link" convention).
 */
export interface NavItemProps extends useRender.ComponentProps<'a'> {
  /** The page you are on: `aria-current="page"`, which every variant paints as the pressed well. */
  current?: boolean | undefined
}

const currentProps = (current: boolean | undefined) =>
  (current ? { 'aria-current': 'page' as const } : {})

/** Sidebar nav row: 192×48, radius 24, icon lane 22 + label 16/24 at 500; current = pressed + 600. */
export const navRowVariants = cva(
  cn(
    'flex h-12 items-center gap-3 rounded-lg px-3.5',
    'text-base font-medium text-foreground',
    'transition-press',
    'hover:bg-accent',
    'aria-[current=page]:material-pressed aria-[current=page]:font-semibold',
    'focus-ring',
  ),
)

export function NavRow({ className, current, render, ...props }: NavItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      { className: cn(navRowVariants(), className), ...currentProps(current) },
      props,
    ),
    render,
    state: { slot: 'nav-row' },
  })
}

/** The 22×22 lane every nav row shares, so labels line up whatever glyph sits in it. */
export function NavIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      data-slot="nav-icon"
      /* an emoji in the lane sits on the `xl` step with the glyph's own leading */
      className={cn('inline-flex size-icon shrink-0 items-center justify-center text-xl leading-none', className)}
      {...props}
    />
  )
}

/** Utility link under the sidebar's nav: current page = 36px pressed pill. */
export const utilityLinkVariants = cva(
  cn(
    '-ml-3 inline-flex h-9 items-center rounded-md px-3',
    'text-sm font-medium text-foreground',
    'transition-tint',
    'hover:bg-accent',
    'aria-[current=page]:material-pressed aria-[current=page]:font-semibold',
    'pointer-coarse:min-h-hit',
    'focus-ring',
  ),
)

export function UtilityLink({ className, current, render, ...props }: NavItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      { className: cn(utilityLinkVariants(), className), ...currentProps(current) },
      props,
    ),
    render,
    state: { slot: 'utility-link' },
  })
}

/**
 * Tab bar item: 62×44, radius 22, icon 22 over a 12px label at 500; current = pressed + 600.
 * `primary` is the bar's single Mint item — raised in the action colour, and still the action
 * colour when it is the current page.
 */
export const tabItemVariants = cva(
  cn(
    'flex h-hit w-15.5 shrink-0 flex-col items-center justify-center gap-1 rounded-full',
    'text-xs leading-tight font-medium text-foreground',
    'aria-[current=page]:material-pressed aria-[current=page]:font-semibold',
    'focus-ring',
  ),
  {
    variants: {
      primary: {
        true: cn(
          'material-raised bg-primary text-primary-foreground',
          'aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground',
        ),
        false: '',
      },
    },
    defaultVariants: { primary: false },
  },
)

export interface TabItemProps extends NavItemProps, VariantProps<typeof tabItemVariants> {}

export function TabItem({ className, current, primary, render, ...props }: TabItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      { className: cn(tabItemVariants({ primary }), className), ...currentProps(current) },
      props,
    ),
    render,
    /* `primary: false` writes no attribute, so the Mint item is the only `[data-primary]` row */
    state: { slot: 'tab-item', primary: primary === true },
  })
}

/** Onest 14 ink-muted; the current page is 600 ink (react-router's `aria-current` from NavLink). */
export const footerLinkVariants = cva(
  cn(
    'text-muted-foreground',
    'transition-tint',
    'hover:text-foreground',
    'aria-[current=page]:font-semibold aria-[current=page]:text-foreground',
    'pointer-coarse:inline-flex pointer-coarse:min-h-hit pointer-coarse:items-center',
    'focus-ring',
  ),
)

export function FooterLink({ className, current, render, ...props }: NavItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      { className: cn(footerLinkVariants(), className), ...currentProps(current) },
      props,
    ),
    render,
    state: { slot: 'footer-link' },
  })
}
