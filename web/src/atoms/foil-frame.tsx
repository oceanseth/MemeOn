import { createElement, forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { glowStyleFor } from '@memeon/shared/tiers'
import { cn } from '@/lib/cn'
import { tierFrameClasses } from '@/atoms/foil'
import './foil.css'

export type FoilCardTag = 'div' | 'li' | 'article'

export interface FoilCardProps extends HTMLAttributes<HTMLElement> {
  /** @default 'div' */
  as?: FoilCardTag | undefined
  tierKey: string
  /** Adds class `tier-card` for the rarity-ladder forced-colors host. Not a DOM attribute. */
  rarityLadder?: boolean | undefined
  /** The grid card's physical collectible construction. Legacy callers keep the compact frame. */
  presentation?: 'default' | 'collectible' | undefined
}

/** Host for a foil frame. Callers pass `tierKey`; they do not set glow or foil class names. */
export const FoilCard = forwardRef<HTMLElement, FoilCardProps>(function FoilCard(
  { as = 'div', tierKey, rarityLadder, presentation = 'default', className, ...rest },
  ref,
) {
  return createElement(as, {
    ...rest,
    ref,
    className: cn(tierFrameClasses(tierKey), rarityLadder && 'tier-card', className),
    'data-presentation': presentation,
    'data-glow-style': glowStyleFor(tierKey),
  })
})

export interface FoilMediaProps extends HTMLAttributes<HTMLSpanElement> {
  /** The grid card's layered backing, material rail and inset art window. */
  presentation?: 'default' | 'collectible' | undefined
  /** Corner seal rendered outside the source-media safe rectangle. */
  seal?: ReactNode | undefined
}

/** Inner media box. Extra layout via `className`; callers do not spell the foil frame classes. */
export function FoilMedia({
  presentation = 'default',
  seal,
  className,
  children,
  ...rest
}: FoilMediaProps) {
  const isCollectible = presentation === 'collectible'
  return (
    <span
      {...rest}
      data-slot="foil-media"
      data-presentation={presentation}
      className={cn(
        'foil-frame foil-media relative',
        isCollectible ? 'bg-transparent' : 'rounded-md bg-muted',
        className,
      )}
    >
      {isCollectible ? (
        <>
          <span data-slot="collectible-backing" aria-hidden="true" />
          <span data-slot="collectible-rail">
            <span data-slot="collectible-window">{children}</span>
          </span>
          {seal}
        </>
      ) : (
        children
      )}
    </span>
  )
}
