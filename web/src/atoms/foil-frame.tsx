import { createElement, forwardRef, type HTMLAttributes } from 'react'
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
}

/** Host for a foil frame. Callers pass `tierKey`; they do not set glow or foil class names. */
export const FoilCard = forwardRef<HTMLElement, FoilCardProps>(function FoilCard(
  { as = 'div', tierKey, rarityLadder, className, ...rest },
  ref,
) {
  return createElement(as, {
    ...rest,
    ref,
    className: cn(tierFrameClasses(tierKey), rarityLadder && 'tier-card', className),
    'data-glow-style': glowStyleFor(tierKey),
  })
})

export interface FoilMediaProps extends HTMLAttributes<HTMLSpanElement> {}

/** Inner media box. Extra layout via `className`; callers do not spell the foil frame classes. */
export function FoilMedia({ className, ...rest }: FoilMediaProps) {
  return (
    <span
      {...rest}
      data-slot="foil-media"
      className={cn('foil-frame foil-media relative rounded-md bg-muted', className)}
    />
  )
}
