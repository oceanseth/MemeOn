import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { Skeleton } from '@/atoms/skeleton'
import { cn } from '@/lib/cn'
import type { MasonryGridModel } from '../hooks/useMasonryLayout'
import './masonry-grid.css'

/**
 * Skip-rendering slot around each card, absolutely positioned by the layout engine.
 * `content-visibility` must not sit on the card itself — it would clip the foil bloom, which
 * the `box-content` padding / negative-margin pair contains without moving the slot's box:
 * the padding box grows outward, the content box stays the slot's exact width × height.
 */
const slotClasses = cn(
  'absolute box-content grid',
  'skip-render',
  'pointer-events-none p-7.5 -m-7.5 *:pointer-events-auto',
)

export interface MasonryGridItem {
  node: ReactNode
  /** spoken label for the slot (Binder names its cards); the card's own labels otherwise */
  ariaLabel?: string | undefined
}

export interface MasonryGridProps extends HTMLAttributes<HTMLDivElement> {
  model: MasonryGridModel
  /** one entry per slot, index-aligned with `model.slots` (both derive from one feed) */
  items: readonly MasonryGridItem[]
}

/**
 * Giphy-style masonry canvas: a measured full-width wrapper, a centred fixed-width canvas,
 * and absolutely-positioned slots in DOM feed order — Tab and screen-reader order follow the
 * feed, not the columns. All geometry arrives via the model; this renders it.
 */
export function MasonryGrid({ model, items, className, ...rest }: MasonryGridProps) {
  return (
    <div
      {...rest}
      ref={model.containerRef}
      data-slot="masonry-grid"
      className={cn('w-full', className)}
    >
      <div
        data-slot="masonry-canvas"
        role="list"
        className="relative mx-auto"
        style={
          {
            '--masonry-w': `${model.canvasWidth}px`,
            '--masonry-h': `${model.height}px`,
          } as CSSProperties
        }
      >
        {model.slots.map((slot, index) => {
          const item = items[index]
          if (!item) return null
          return (
            <div
              key={slot.key}
              data-slot="masonry-item"
              role="listitem"
              aria-label={item.ariaLabel}
              className={slotClasses}
              style={
                {
                  '--masonry-x': `${slot.x}px`,
                  '--masonry-y': `${slot.y}px`,
                  '--masonry-w': `${slot.width}px`,
                  '--masonry-h': `${slot.height}px`,
                } as CSSProperties
              }
            >
              {item.node}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The loading state every masonry screen shares: one placeholder per skeleton slot. */
export function MasonrySkeletonGrid({
  model,
  ...rest
}: Omit<MasonryGridProps, 'items' | 'aria-hidden'>) {
  return (
    <MasonryGrid
      {...rest}
      model={model}
      aria-hidden="true"
      items={model.slots.map(() => ({ node: <Skeleton className="h-full" /> }))}
    />
  )
}
