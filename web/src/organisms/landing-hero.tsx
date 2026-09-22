import type { ReactNode } from 'react'
import { Alert } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { TierSeal } from '@/atoms/tier-seal'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

const SECTION =
  'mt-4 rounded-xl border border-border bg-accent px-6 py-10 max-md:px-4 max-md:py-8 md:px-10 md:py-12'

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
> & {
  marketplaceCta: ReactNode
}

/** Rounded hero panel with the complete rarity ladder rendered as collectible cards. */
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
  marketplaceCta,
}: LandingHeroProps) {
  return (
    <section data-slot="landing-hero" className={SECTION}>
      <div className="grid items-center gap-10 2xl:grid-cols-(--grid-hero) 2xl:gap-12">
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

        <ol
          data-slot="hero-cards"
          className="m-0 grid min-w-0 list-none grid-cols-4 gap-3 p-0 max-sm:grid-cols-2"
        >
          {heroCards.map((card) => (
            <FoilCard
              as="li"
              ref={card.cardRef}
              key={card.tierKey}
              data-slot="hero-card"
              tierKey={card.tierKey}
              presentation="collectible"
              rarityLadder
              className="min-w-0"
            >
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
              <div className="px-1 pt-2 text-center">
                <p
                  data-slot="hero-tier-name"
                  className="m-0 font-sans text-sm font-semibold text-foreground"
                >
                  {card.tierName}
                </p>
                <p className="m-0 mt-0.5 text-xs font-semibold text-foreground tabular-nums">
                  {card.resharesLabel}
                </p>
                <p className="m-0 text-xs text-muted-foreground">{card.rarityLabel}</p>
              </div>
            </FoilCard>
          ))}
        </ol>
      </div>
    </section>
  )
}
