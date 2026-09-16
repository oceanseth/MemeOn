import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Separator } from '@/atoms/separator'

/**
 * A stack of rows. No `role="list"` (the registry's): a list must hold `listitem`s, and a row
 * rendered as a link cannot be one — a consumer that wants list semantics wraps `<ul>/<li>`.
 */
export function ItemGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-group"
      className={cn('group/item-group flex w-full flex-col gap-2', className)}
      {...props}
    />
  )
}

export function ItemSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn('my-1', className)} {...props} />
}

/**
 * The row primitive: 44px of target, media / content / actions slots, a `rounded-md` well or a
 * hairline outline. Rendered as a link or button through `render`, it takes the hover tint.
 */
export const itemVariants = cva(
  cn(
    'group/item flex w-full min-h-hit flex-wrap items-center rounded-md text-base text-foreground',
    'transition-tint outline-none focus-ring',
    '[a]:cursor-pointer [a]:no-underline [a]:hover:bg-accent [button]:cursor-pointer [button]:hover:bg-accent',
  ),
  {
    variants: {
      variant: {
        default: '',
        outline: 'border border-border',
        muted: 'bg-muted',
      },
      size: {
        default: 'gap-3 px-3 py-2.5',
        sm: 'gap-2.5 px-2.5 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ItemProps = useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>

export function Item({ className, variant = 'default', size = 'default', render, ...props }: ItemProps) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(itemVariants({ variant, size }), className) }, props),
    render,
    state: {
      slot: 'item',
      variant,
      size,
    },
  })
}

/** The leading slot: an avatar or thumbnail (`image`), a glyph (`icon`), or anything (`default`). */
export const itemMediaVariants = cva(
  cn(
    'flex shrink-0 items-center justify-center gap-2',
    'group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start',
  ),
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: 'text-xl leading-none',
        image: 'size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 *:size-full *:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function ItemMedia({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

export function ItemContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="item-content" className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />
}

const itemTitleVariants = cva('flex w-fit max-w-full items-center gap-2 text-base font-semibold text-foreground', {
  variants: {
    /** one line, ellipsis — a name in a fixed-width row; off, a message wraps */
    truncate: {
      true: 'truncate',
      false: 'wrap-anywhere',
    },
  },
  defaultVariants: {
    truncate: false,
  },
})

export function ItemTitle({
  className,
  truncate,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof itemTitleVariants>) {
  return <div data-slot="item-title" className={cn(itemTitleVariants({ truncate }), className)} {...props} />
}

export function ItemDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn('m-0 text-left text-sm font-normal text-muted-foreground text-pretty', className)}
      {...props}
    />
  )
}

export function ItemActions({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="item-actions" className={cn('flex items-center gap-2', className)} {...props} />
}

export function ItemHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-header"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

export function ItemFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-footer"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}
