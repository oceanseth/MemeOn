import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * Base UI's Collapsible with the registry's part names. `plain` is the bare disclosure; `card` is
 * the raised card a question sits on — the three parts each carry their share of it, so a
 * composition never paints through `render`. Base UI marks state with `data-open`/`data-closed` on
 * every part and `data-panel-open` on the trigger, so a caret turns with `group-data-panel-open:`.
 */
export const collapsibleVariants = cva('', {
  variants: {
    variant: {
      plain: '',
      card: 'mb-2.5 rounded-lg material-raised',
    },
  },
  defaultVariants: { variant: 'plain' },
})

type CollapsibleVariant = NonNullable<VariantProps<typeof collapsibleVariants>['variant']>

export const collapsibleTriggerVariants = cva('', {
  variants: {
    variant: {
      plain: '',
      card: cn(
        'group flex w-full min-h-hit cursor-pointer items-center gap-3 rounded-lg px-4.5 py-3.5 text-left',
        'focus-ring',
      ),
    },
  },
  defaultVariants: { variant: 'plain' },
})

export const collapsibleContentVariants = cva('', {
  variants: {
    variant: {
      plain: '',
      card: 'px-4.5 pb-4 text-base text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'plain' },
})

export type CollapsibleProps = CollapsiblePrimitive.Root.Props & { variant?: CollapsibleVariant; className?: string }

export function Collapsible({ variant, className, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      data-variant={variant ?? 'plain'}
      className={cn(collapsibleVariants({ variant }), className)}
      {...props}
    />
  )
}

export function CollapsibleTrigger({
  variant,
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { variant?: CollapsibleVariant; className?: string }) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(collapsibleTriggerVariants({ variant }), className)}
      {...props}
    />
  )
}

export function CollapsibleContent({
  variant,
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props & { variant?: CollapsibleVariant; className?: string }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(collapsibleContentVariants({ variant }), className)}
      {...props}
    />
  )
}
