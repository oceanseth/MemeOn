import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

export function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: Styled<TabsPrimitive.Root.Props>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn(
        'group/tabs flex gap-4.5',
        orientation === 'horizontal' ? 'flex-col' : 'flex-row',
        className,
      )}
      {...props}
    />
  )
}

/**
 * `default` is the pressed well with the active tab raised out of it (34px segments in a 40px
 * well); `pills` is a row of raised pills where the active one sinks — the Profile tabs.
 */
export const tabsListVariants = cva(
  'group/tabs-list flex items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
  {
    variants: {
      variant: {
        default: 'w-fit gap-0.5 rounded-full material-pressed p-0.75',
        pills: 'flex-wrap gap-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/** The list's `data-variant` paints the triggers through `group/tabs-list`, so callers set
 * `variant` once on the list. */
const tabsTriggerVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none',
    'transition-press focus-ring disabled-look',
    'group-data-[variant=default]/tabs-list:h-8.5',
    'group-data-[variant=default]/tabs-list:min-w-0',
    'group-data-[variant=default]/tabs-list:flex-1',
    'group-data-[variant=default]/tabs-list:rounded-md',
    'group-data-[variant=default]/tabs-list:bg-transparent',
    'group-data-[variant=default]/tabs-list:px-3',
    'group-data-[variant=default]/tabs-list:text-sm',
    'group-data-[variant=default]/tabs-list:font-semibold',
    'group-data-[variant=default]/tabs-list:text-muted-foreground',
    'group-data-[variant=default]/tabs-list:hover:text-foreground',
    'group-data-[variant=default]/tabs-list:data-active:material-raised',
    'group-data-[variant=default]/tabs-list:data-active:font-semibold',
    'group-data-[variant=default]/tabs-list:data-active:text-foreground',
    'group-data-[variant=pills]/tabs-list:h-11.5',
    'group-data-[variant=pills]/tabs-list:rounded-lg',
    'group-data-[variant=pills]/tabs-list:material-raised',
    'group-data-[variant=pills]/tabs-list:px-4.5',
    'group-data-[variant=pills]/tabs-list:text-base',
    'group-data-[variant=pills]/tabs-list:font-semibold',
    'group-data-[variant=pills]/tabs-list:text-foreground',
    'group-data-[variant=pills]/tabs-list:press',
    'group-data-[variant=pills]/tabs-list:data-active:material-pressed',
  ),
)

type TabsListVariants = VariantProps<typeof tabsListVariants>
export type TabsListVariant = NonNullable<TabsListVariants['variant']>

export function TabsList({
  className,
  variant,
  children,
  ...props
}: Styled<TabsPrimitive.List.Props> & TabsListVariants) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant ?? 'default'}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, ...props }: Styled<TabsPrimitive.Tab.Props>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants(), className)}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: Styled<TabsPrimitive.Panel.Props>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 outline-none focus-ring', className)}
      {...props}
    />
  )
}
