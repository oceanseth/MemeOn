import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * The raised card a screen shows in place of content: nothing here, an error, an outcome.
 * The variant tints the card and colours the title; the description stays muted. `inline` is
 * the mint flow's state card: field radius, a tight inset, left-aligned, the phone title step —
 * the parts read the size through the `empty` group.
 */
export const emptyVariants = cva(
  [
    'group/empty flex w-full min-w-0 flex-col items-center justify-center',
    'rounded-lg material-card text-center text-base',
  ],
  {
    variants: {
      variant: {
        neutral: 'text-foreground',
        /** work in flight inside a form panel: the raised fill, the title muted with the body */
        busy: 'material-raised text-muted-foreground',
        error: 'bg-error text-error-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        info: 'bg-info text-info-foreground',
      },
      size: {
        default: 'gap-gutter p-card-inset',
        inline: 'items-start gap-3 rounded-md p-4 text-left',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'default' },
  },
)

export type EmptyVariant = NonNullable<VariantProps<typeof emptyVariants>['variant']>

export type EmptyProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof emptyVariants>

/** A live region like `Alert`: `error` interrupts, the rest is polite; an explicit `role` wins. */
export function Empty({ className, variant, size, role, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-variant={variant ?? 'neutral'}
      data-size={size ?? 'default'}
      role={role ?? (variant === 'error' ? 'alert' : 'status')}
      className={cn(emptyVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export function EmptyHeader({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-[60ch] flex-col items-center gap-3',
        'group-data-[size=inline]/empty:items-start group-data-[size=inline]/empty:gap-2',
        className,
      )}
      {...props}
    />
  )
}

/** `default` is a glyph (an emoji at the hero step); `icon` is a lucide glyph on a muted tile. */
export const emptyMediaVariants = cva('flex shrink-0 items-center justify-center', {
  variants: {
    variant: {
      default: 'text-6xl leading-none',
      icon: 'size-12 rounded-md bg-muted text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function EmptyMedia({
  className,
  variant,
  ...props
}: ComponentPropsWithoutRef<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant ?? 'default'}
      aria-hidden="true"
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

/** An `h3` at the card-title step in the display face; `render={<h2 />}` where the outline needs it. */
export function EmptyTitle({
  className,
  render,
  ...props
}: Omit<useRender.ComponentProps<'h3'>, 'ref'>) {
  return useRender({
    defaultTagName: 'h3',
    render,
    props: {
      ...props,
      'data-slot': 'empty-title',
      className: cn(
        'm-0 font-display text-2xl font-normal text-balance',
        'group-data-[size=inline]/empty:text-xl',
        'group-data-[variant=busy]/empty:text-muted-foreground',
        className,
      ),
    },
  })
}

export function EmptyDescription({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        'm-0 text-base text-muted-foreground text-pretty',
        'group-data-[size=inline]/empty:text-sm group-data-[size=inline]/empty:font-medium',
        className,
      )}
      {...props}
    />
  )
}

/** The action row: buttons, links, a confirmation alert. */
export function EmptyContent({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('flex w-full flex-wrap items-center justify-center gap-2.5', className)}
      {...props}
    />
  )
}

/** Centred page-level state (loading / not found / redirecting); `compact` is the end-of-list note. */
export const pageStateVariants = cva('text-center text-muted-foreground', {
  variants: {
    size: {
      default: 'pt-20',
      compact: 'pt-8 text-sm',
    },
  },
  defaultVariants: { size: 'default' },
})

export function PageState({
  className,
  size,
  ...props
}: ComponentPropsWithoutRef<'div'> & VariantProps<typeof pageStateVariants>) {
  return (
    <div
      data-slot="page-state"
      data-size={size ?? 'default'}
      className={cn(pageStateVariants({ size }), className)}
      {...props}
    />
  )
}
