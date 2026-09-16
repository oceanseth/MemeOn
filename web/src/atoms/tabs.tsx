import { createContext, useContext } from 'react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

export function Tabs({ className, orientation = 'horizontal', ...props }: Styled<TabsPrimitive.Root.Props>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn('group/tabs flex gap-4.5', orientation === 'horizontal' ? 'flex-col' : 'flex-row', className)}
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

const tabsTriggerVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none',
    'transition-press focus-ring disabled-look',
  ),
  {
    variants: {
      variant: {
        default: cn(
          'h-8.5 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm font-semibold text-muted-foreground',
          'hover:text-foreground',
          'data-active:material-raised data-active:font-semibold data-active:text-foreground',
        ),
        pills: cn(
          'h-11.5 rounded-lg material-raised px-4.5 text-base font-semibold text-foreground',
          'press',
          'data-active:material-pressed',
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type TabsListVariants = VariantProps<typeof tabsListVariants>
export type TabsListVariant = NonNullable<TabsListVariants['variant']>

/** The list hands its variant to its tabs, so a trigger never has to be told which row it is in. */
const TabsListContext = createContext<TabsListVariants>({})

export function TabsList({ className, variant, children, ...props }: Styled<TabsPrimitive.List.Props> & TabsListVariants) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant ?? 'default'}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      <TabsListContext.Provider value={{ variant }}>{children}</TabsListContext.Provider>
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, ...props }: Styled<TabsPrimitive.Tab.Props>) {
  const { variant } = useContext(TabsListContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
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
