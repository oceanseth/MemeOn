import { Link } from 'react-router-dom'
import { buttonVariants } from '@/atoms/button'
import { Heading } from '@/atoms/heading'
import { Icon } from '@/atoms/icon'
import { PageContainer } from '@/atoms/page-container'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { HeroVideo } from '@/molecules/hero-video'
import { LandingClosing } from '@/organisms/landing-closing'
import { LandingFaq } from '@/organisms/landing-faq'
import { LandingHero } from '@/organisms/landing-hero'
import { LandingHow } from '@/organisms/landing-how'
import { LandingTiers } from '@/organisms/landing-tiers'
import './LandingScreen.css'

const SECTION = 'mt-14 max-md:mt-10'

/** Landing as a function of its model. Every engine state is one set of args. */
export function LandingScreen(model: LandingScreenModel) {
  const marketplaceCta = (
    <Link className={buttonVariants({ variant: 'primary', size: 'login' })} to="/marketplace">
      <span aria-hidden="true">
        <Icon name="playing-card" size={18} />
      </span>{' '}
      {model.marketplaceCta}
    </Link>
  )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <LandingHero {...model} marketplaceCta={marketplaceCta} />
      <LandingHow {...model} />
      <LandingTiers {...model} />
      {/* The promo film: the whole loop, framed like the cards above it, right
          before the questions it raises. */}
      <section data-slot="landing-film" className={SECTION}>
        <Heading size="section">{model.filmTitle}</Heading>
        <HeroVideo model={model.heroVideo} className="mt-6 max-w-220" />
      </section>
      <LandingFaq {...model} />
      <LandingClosing {...model} marketplaceCta={marketplaceCta} />
    </PageContainer>
  )
}
