import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * The raised card. A block with the card inset (the phone takes the gutter), not the registry's
 * flex column: the parts below space themselves, so free content — a heading, a paragraph, a
 * form — flows as it would anywhere.
 */
const cardVariants = cva('rounded-lg material-card', {
  variants: {
    variant: {
      default: '',
      /** the raised fill instead of the card's: a band that sits on another card */
      accent: 'bg-accent',
      /** a fresh or selected card: the primary ring inside the edge */
      highlighted: 'inset-ring-2 inset-ring-primary',
      /** a well, not a plate: a rail that holds cards of its own */
      pressed: 'material-pressed',
    },
    size: {
      default: 'p-6 max-md:p-4.5',
      sm: 'p-5 max-md:p-4.5',
      xs: 'px-5 py-4',
      /** the one centred card of a route that is nothing but the card */
      lg: 'px-8 py-10 max-md:p-6.5',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, size, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size ?? 'default'}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
}

/** Title and description stack in the first column; an action, when present, takes the second. */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min items-start gap-1',
        'has-data-[slot=card-action]:grid-cols-(--grid-card-action) has-data-[slot=card-description]:grid-rows-(--grid-card-rows)',
        className,
      )}
      {...props}
    />
  )
}

/** The heading steps a card title takes; `intro` is the panel default. */
const cardTitleVariants = cva('m-0 font-display font-normal text-foreground text-balance', {
  variants: {
    size: {
      intro: 'font-sans text-lg font-semibold',
      'card-title': 'text-2xl',
      title: 'text-3xl',
    },
  },
  defaultVariants: { size: 'intro' },
})

export type CardTitleSize = NonNullable<VariantProps<typeof cardTitleVariants>['size']>

export interface CardTitleProps
  extends Omit<useRender.ComponentProps<'h2'>, 'className'>,
    VariantProps<typeof cardTitleVariants> {
  className?: string | undefined
}

/** An `<h2>` unless `render` says otherwise (`render={<h3 />}`); a heading, not the registry's div. */
export function CardTitle({ className, size, render, ...props }: CardTitleProps) {
  return useRender({
    defaultTagName: 'h2',
    props: mergeProps<'h2'>({ className: cn(cardTitleVariants({ size }), className) }, props),
    render,
    state: { slot: 'card-title', size: size ?? 'intro' },
  })
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function CardAction({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn('not-first:mt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex flex-wrap items-center gap-2.5 not-first:mt-4', className)}
      {...props}
    />
  )
}

export { cardVariants, cardTitleVariants }
