import type { ReactNode } from 'react'
import { Alert } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { TierSeal } from '@/atoms/tier-seal'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import './landing-hero.css'

/* The panel clips: on a phone the fan's outer seats run past its edge on purpose. */
const SECTION = cn(
  'mt-4 overflow-hidden rounded-xl border border-border bg-accent text-center',
  'px-6 pt-10 pb-6 max-md:px-4 max-md:pt-8 max-md:pb-4 md:px-10 md:pt-12',
)

export type LandingHeroProps = Pick<
  LandingScreenModel,
  | 'heroTitle'
  | 'heroBody'
  | 'heroStats'
  | 'showMarketplaceCta'
  | 'showLoginButton'
  | 'showErr'
  | 'err'
  | 'loginLabel'
  | 'loginAside'
  | 'loginButtonProps'
  | 'errorNoticeProps'
  | 'heroCards'
> & {
  marketplaceCta: ReactNode
}

/**
 * Rounded hero panel: a centred stack of title, lede, the ladder's three figures and the call to
 * action, with the complete rarity ladder fanned beneath it as a hand of collectible cards
 * (`landing-hero.css` owns the fan; each card carries its seat as `data-fan`).
 */
export function LandingHero({
  heroTitle,
  heroBody,
  heroStats,
  showMarketplaceCta,
  showLoginButton,
  showErr,
  err,
  loginLabel,
  loginAside,
  loginButtonProps,
  errorNoticeProps,
  heroCards,
  marketplaceCta,
}: LandingHeroProps) {
  return (
    <section data-slot="landing-hero" className={SECTION}>
      <div className="mx-auto flex max-w-190 flex-col items-center">
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
        <dl data-slot="hero-stats" className="m-0 mt-7 grid grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.key}
              className={cn(
                'flex flex-col-reverse items-center gap-1.5 border-l border-border',
                'px-6 first:border-l-0 max-md:px-2.5',
              )}
            >
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="m-0 font-display text-3xl text-foreground tabular-nums max-md:text-xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        {showMarketplaceCta ? (
          <div className="mt-8">{marketplaceCta}</div>
        ) : showLoginButton ? (
          <div className="mt-8 flex flex-col items-center gap-3">
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

      {/* No `p-0` here: the sheet's bottom padding is what keeps the outer seats inside the panel. */}
      <ol data-slot="hero-cards" className="mt-10 list-none max-md:mt-8">
        {heroCards.map((card) => (
          <FoilCard
            as="li"
            ref={card.cardRef}
            key={card.tierKey}
            data-slot="hero-card"
            data-fan={card.fan}
            tierKey={card.tierKey}
            presentation="collectible"
            rarityLadder
          >
            {/* The caption rides the top edge: a fan opens at the top and closes at the foot,
                so that is the one edge of every seat the hand leaves in view. */}
            <div data-slot="hero-card-meta" className="px-1 pb-2">
              <p
                data-slot="hero-tier-name"
                className="m-0 font-sans text-sm font-semibold text-foreground"
              >
                {card.tierName}
              </p>
              <p className="m-0 text-xs font-semibold text-foreground tabular-nums">
                {card.resharesLabel}
              </p>
              <p className="m-0 text-xs text-muted-foreground">{card.rarityLabel}</p>
            </div>
            <FoilMedia
              presentation="collectible"
              seal={<TierSeal tierKey={card.tierKey} label={card.tierLabel} />}
            >
              <span data-slot="collectible-art-link" className="block size-full">
                <img
                  data-slot="meme-art-backdrop"
                  className="absolute inset-0 z-0 block size-full scale-110 object-cover opacity-45 blur-lg saturate-125"
                  {...card.backdropImageProps}
                />
                <img data-slot="meme-art" className="block object-contain" {...card.imageProps} />
              </span>
            </FoilMedia>
          </FoilCard>
        ))}
      </ol>
    </section>
  )
}
