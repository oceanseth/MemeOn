import type { ReactNode } from 'react'
import { Alert } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { TierChip } from '@/atoms/tier-chip'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

const SECTION = '-mx-5 border-b border-border bg-accent px-5 pt-12 pb-14 max-md:pt-8 max-md:pb-10'

/** Hero pile card: percentage positions scale with the column, no phone transform. */
const PILE_CARD = 'absolute origin-top-left rounded-lg material-card p-2'

const PILE_LAYOUT = [
  cn('left-0 top-(--pile-1-top) w-(--pile-1-w)'),
  cn('left-(--pile-2-left) top-0 w-(--pile-2-w) rotate-(--rotate-pile-2)'),
  cn('left-(--pile-3-left) top-(--pile-3-top) w-(--pile-3-w) rotate-(--rotate-pile-3)'),
]

export type LandingHeroProps = Pick<
  LandingScreenModel,
  | 'heroTitle'
  | 'heroBody'
  | 'showMarketplaceCta'
  | 'showLoginButton'
  | 'showErr'
  | 'err'
  | 'loginLabel'
  | 'loginAside'
  | 'loginButtonProps'
  | 'errorNoticeProps'
  | 'heroCards'
  | 'frameImageProps'
  | 'frameSlotProps'
> & {
  /** Screen-local marketplace Link (or story stand-in). Not built in a hook. */
  marketplaceCta: ReactNode
}

/** Hero band: title, login or marketplace CTA, and the three tilted tier specimens. */
export function LandingHero({
  heroTitle,
  heroBody,
  showMarketplaceCta,
  showLoginButton,
  showErr,
  err,
  loginLabel,
  loginAside,
  loginButtonProps,
  errorNoticeProps,
  heroCards,
  frameImageProps,
  frameSlotProps,
  marketplaceCta,
}: LandingHeroProps) {
  return (
    <section data-slot="landing-hero" className={SECTION}>
      <div className="grid items-center gap-12 max-md:gap-8 lg:grid-cols-(--grid-hero) lg:justify-between">
        <div className="min-w-0">
          <h1
            className={cn(
              'm-0 font-display text-4xl font-medium text-foreground text-balance',
              'md:text-6xl',
            )}
          >
            {heroTitle}
          </h1>
          <p className="mt-5 mb-0 max-w-prose text-pretty text-lg text-muted-foreground">
            {heroBody}
          </p>
          {showMarketplaceCta ? (
            <div className="mt-7">{marketplaceCta}</div>
          ) : showLoginButton ? (
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Button variant="primary" size="login" {...loginButtonProps}>
                {loginLabel}
              </Button>
              <p className="m-0 max-w-aside text-sm text-muted-foreground">{loginAside}</p>
            </div>
          ) : null}
          {showErr && (
            <Alert variant="error" className="mt-3" {...errorNoticeProps}>
              {err}
            </Alert>
          )}
        </div>

        <ul
          data-slot="hero-pile"
          /* `w-full` inside a `max-w`, never a fixed width: an `auto` grid track sizes to its
             item's max-content, so a 405px box would widen the column past the phone viewport */
          className="relative m-0 mx-auto aspect-(--aspect-hero-pile) w-full max-w-hero-pile min-w-0 list-none p-0"
        >
          {heroCards.map((card, index) => {
            const image = frameImageProps[card.tierKey]
            return (
              <FoilCard
                as="li"
                key={card.tierKey}
                data-slot="hero-card"
                tierKey={card.tierKey}
                className={cn(PILE_CARD, PILE_LAYOUT[index] ?? PILE_LAYOUT[0])}
              >
                <FoilMedia className="block overflow-hidden">
                  <span
                    data-slot="hero-card-slot"
                    className="relative block aspect-4/3 w-full"
                    {...frameSlotProps[card.tierKey]}
                  >
                    {image ? (
                      <img
                        data-slot="hero-card-art"
                        className="block h-full w-full object-cover"
                        {...image}
                      />
                    ) : null}
                  </span>
                </FoilMedia>
                <span className="mx-1 mt-1.5 mb-1.5 block pr-13 font-sans text-sm font-medium text-foreground md:text-base">
                  {card.caption}
                </span>
                <TierChip
                  tierKey={card.tierKey}
                  label={card.tierName}
                  /* pile seal at the grid thumb's own step (`size="sm"`), pinned to the corner */
                  className="absolute right-2.5 bottom-2.5"
                />
              </FoilCard>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
