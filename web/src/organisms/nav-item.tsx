import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * The shell's navigation links: the top bar's pills, the phone tab bar's items, the footer's
 * links. As components the lint can see them, the current page is a prop rather than a
 * hand-written `aria-current`, and a screen never spells the chrome again.
 *
 * All three render an `<a>` by default and take a router link through `render` — a navigation
 * target is a link, so none of them is a `Button` (shadcn's "as link" convention).
 */
export interface NavItemProps extends useRender.ComponentProps<'a'> {
  /** The page you are on: `aria-current="page"`, which every variant paints as the pressed well. */
  current?: boolean | undefined
}

const currentProps = (current: boolean | undefined) =>
  current ? { 'aria-current': 'page' as const } : {}

/**
 * Top-bar link: a 36px pill, Onest base at 500; the current page is the pressed well at 600. The
 * well is a named view-transition element (`app-shell.css`), so on a route change it glides to
 * the next link instead of blinking there.
 */
export const navPillVariants = cva(
  cn(
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3',
    'text-base font-medium whitespace-nowrap text-foreground no-underline',
    'transition-tint',
    'hover:bg-accent',
    'aria-[current=page]:material-pressed aria-[current=page]:font-semibold',
    'focus-ring',
  ),
)

export function NavPill({ className, current, render, ...props }: NavItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      { className: cn(navPillVariants(), className), ...currentProps(current) },
      props,
    ),
    render,
    state: { slot: 'nav-pill' },
  })
}

/**
 * Tab bar item: 62×44, radius 22, icon 22 over a 12px label at 500; current = pressed + 600.
 * `primary` is the bar's single Mint item — raised in the action colour, and still the action
 * colour when it is the current page.
 */
export const tabItemVariants = cva(
  cn(
    'flex h-11 w-15.5 shrink-0 flex-col items-center justify-center gap-1 rounded-full',
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
      {
        className: cn(tabItemVariants({ primary }), className),
        ...currentProps(current),
      },
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
    'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
    'focus-ring',
  ),
)

export function FooterLink({ className, current, render, ...props }: NavItemProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(footerLinkVariants(), className),
        ...currentProps(current),
      },
      props,
    ),
    render,
    state: { slot: 'footer-link' },
  })
}
