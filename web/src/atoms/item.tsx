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
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn('my-1', className)}
      {...props}
    />
  )
}

/**
 * The row primitive: 44px of target, media / content / actions slots, a `rounded-md` well or a
 * hairline outline. Rendered as a link or button through `render`, it takes the hover tint.
 */
export const itemVariants = cva(
  cn(
    'group/item flex w-full flex-wrap items-center rounded-md text-base text-foreground',
    'transition-tint outline-none focus-ring',
    '[a]:cursor-pointer [a]:no-underline [a]:hover:bg-accent',
    '[button]:cursor-pointer [button]:not-disabled:hover:bg-accent [button]:disabled:disabled-look',
    'aria-pressed:material-pressed',
  ),
  {
    variants: {
      variant: {
        default: '',
        outline: 'border border-border',
        muted: 'bg-muted',
        /** a row that is its own card: the podium tiles and the raised person row */
        raised: 'material-card',
      },
      size: {
        default: 'min-h-11 gap-3 px-3 py-2.5',
        sm: 'min-h-11 gap-2.5 px-2.5 py-2',
        /** the card-shaped row: a person, a rank, an API key, a settings line */
        row: 'min-h-11 gap-3 rounded-lg px-5 py-3.5',
        /**
         * The flush row of a scrolling panel list — the alerts popover's. Square and
         * gutter-to-gutter, because a list of nine rows reads as one column only if nothing
         * floats: the separation is the parent's hairline (`divide-y`), not a gap. The ring is
         * inset for the same reason the dropdown's is — the list clips its own overflow, and an
         * outset ring on the first or last row would be sliced by that edge.
         */
        notice: 'min-h-11 gap-3 rounded-none px-3.5 py-3 focus-ring-inset',
        /** a static line inside a well: no target floor, no inset, no hover */
        flush: 'min-h-0 gap-3 px-0 py-0',
      },
      /** The ring a row wears when it is *you* or first: podium #1 (`primary`), your row (`brand`). */
      frame: {
        none: '',
        brand: 'border-2 border-brand bg-accent',
        primary: 'border-2 border-primary bg-accent',
      },
      /** A row that carries a status: the unread alert's tint. */
      tone: {
        none: '',
        info: 'bg-info text-info-foreground',
        /**
         * Unread, in a list where most rows are: the raised surface and nothing else. `info`
         * paints a full-bleed blue slab, which at three rows in a row made the read alerts
         * beneath them look disabled; the weight and the dot carry the state, and this only has
         * to lift the row off the panel.
         */
        unread: 'bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      frame: 'none',
      tone: 'none',
    },
  },
)

export type ItemProps = useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>

export function Item({
  className,
  variant = 'default',
  size = 'default',
  frame = 'none',
  tone = 'none',
  render,
  ...props
}: ItemProps) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(itemVariants({ variant, size, frame, tone }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'item',
      variant,
      size,
      frame,
      tone,
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
        image:
          'size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 *:size-full *:object-cover',
        /**
         * The mark's disc: a 32px well holding one emoji or one 18px glyph. Fixed, because what
         * it buys is the column — an emoji is as wide as it likes, and without the disc every
         * message in the list would start on a different vertical. Top-aligned: beside a message
         * that wraps to two lines, a centred mark reads as floating.
         */
        disc: 'size-8 self-start rounded-full bg-muted text-base leading-none text-muted-foreground',
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
  return (
    <div
      data-slot="item-content"
      className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}
      {...props}
    />
  )
}

const itemTitleVariants = cva(
  'flex w-fit max-w-full items-center gap-2 font-semibold text-foreground',
  {
    variants: {
      /** the row's own step; `lg` is the name a person / rank / card row carries */
      size: {
        default: 'text-base',
        lg: 'text-lg',
      },
      /** one line, ellipsis — a name in a fixed-width row; off, a message wraps */
      truncate: {
        true: 'truncate',
        false: 'wrap-anywhere',
      },
    },
    defaultVariants: {
      size: 'default',
      truncate: false,
    },
  },
)

export function ItemTitle({
  className,
  size,
  truncate,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof itemTitleVariants>) {
  return (
    <div
      data-slot="item-title"
      data-size={size ?? 'default'}
      className={cn(itemTitleVariants({ size, truncate }), className)}
      {...props}
    />
  )
}

export function ItemDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'm-0 text-left text-sm font-normal text-muted-foreground text-pretty',
        className,
      )}
      {...props}
    />
  )
}

export function ItemActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="item-actions" className={cn('flex items-center gap-2', className)} {...props} />
  )
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
