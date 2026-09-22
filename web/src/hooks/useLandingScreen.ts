import { TIERS } from '@memeon/shared/tiers'
import type { ButtonHTMLAttributes, HTMLAttributes, ImgHTMLAttributes, RefCallback } from 'react'
import { landingCopy } from '../copy/landing'
import { beginMaskyLogin } from '../lib/auth'
import { cardMediaRef } from '../lib/cardMedia'
import type { HeroVideoModel } from '../lib/heroVideoModel'
import { landingMachine, type LandingPhase } from '../stores/landingMachine'
import { useAuth } from './useAuth'
import { useHeroVideo } from './useHeroVideo'
import { useProjectedActor } from './useProjectedActor'

export type LandingLoginButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy' | 'aria-label'
>

export type LandingHeroImageProps = Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'loading' | 'aria-hidden'
>

export type LandingErrorNoticeProps = Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>

export interface LandingHeroCardModel {
  tierKey: string
  /** The card's seat in the hero fan: 0 at the centre, negative to the left (`data-fan`). */
  fan: number
  tierName: string
  tierLabel: string
  resharesLabel: string
  rarityLabel: string
  imageProps: LandingHeroImageProps
  backdropImageProps: LandingHeroImageProps
  cardRef: RefCallback<HTMLElement>
}

export interface LandingHeroStatModel {
  key: string
  /** Already formatted for the locale. */
  value: string
  label: string
}

export interface LandingHowStepModel {
  step: string
  title: string
  body: string
}

export interface LandingFaqItemModel {
  id: string
  question: string
  body: string
  defaultOpen: boolean
  imageSrc?: string
  imageAlt?: string
}

const copy = landingCopy
const BRAINCELL_IMAGE_SRC = '/api/brand/braincell.png'
const HERO_IMAGE_SRC = '/brand/hero-cat.webp'
/** Every minted meme is one hundred shares (`api`); the landing quotes it. */
const SHARES_PER_CARD = 100

/** The ladder in order, seated so the middle tier is the centre of the fan. */
export function buildLandingHeroCards(): LandingHeroCardModel[] {
  const centre = Math.floor((TIERS.length - 1) / 2)
  return TIERS.map((tier, index) => ({
    tierKey: tier.key,
    fan: index - centre,
    tierName: tier.name,
    tierLabel: `${tier.name} · ${tier.rarity}`,
    resharesLabel: copy.tier.reshares(tier.minReshares),
    rarityLabel: tier.rarity,
    imageProps: { src: HERO_IMAGE_SRC, alt: '', loading: 'eager' },
    backdropImageProps: {
      src: HERO_IMAGE_SRC,
      alt: '',
      loading: 'eager',
      'aria-hidden': true,
    },
    cardRef: cardMediaRef,
  }))
}

/** Tiers, shares a card, and the reshares the top tier asks for: all read off the ladder. */
export function buildLandingHeroStats(): LandingHeroStatModel[] {
  const top = TIERS[TIERS.length - 1]
  if (!top) throw new Error('TIERS is empty')
  return [
    { key: 'tiers', value: TIERS.length.toLocaleString(), label: copy.hero.stats.tiers },
    { key: 'shares', value: SHARES_PER_CARD.toLocaleString(), label: copy.hero.stats.shares },
    {
      key: 'reshares',
      value: top.minReshares.toLocaleString(),
      label: copy.hero.stats.reshares(top.name),
    },
  ]
}

export function buildLandingHowSteps(): LandingHowStepModel[] {
  return copy.how.steps.map((step) => ({
    step: step.step,
    title: step.title,
    body: step.body,
  }))
}

export function buildLandingFaqItems(): LandingFaqItemModel[] {
  return copy.faq.items.map((item, index) => {
    const imageAlt = 'imageAlt' in item ? item.imageAlt : undefined
    return {
      id: item.id,
      question: item.question,
      body: item.body,
      defaultOpen: index === 0,
      ...(imageAlt ? { imageSrc: BRAINCELL_IMAGE_SRC, imageAlt } : {}),
    }
  })
}

export function loginErrorCopy(err: string | null): string | null {
  return err ? copy.errors.login : null
}

const interactiveLandingMachine = landingMachine.provide({
  actions: {
    startLogin: ({ self }) => {
      void beginMaskyLogin().catch((e) => {
        self.send({
          type: 'FAIL',
          err: e instanceof Error ? e.message : copy.machine.loginFailed,
        })
      })
    },
  },
})

export interface LandingScreenModel {
  phase: LandingPhase
  err: string | null
  showMarketplaceCta: boolean
  showLoginButton: boolean
  showErr: boolean
  loginLabel: string
  loginAside: string
  marketplaceCta: string
  closingLine: string
  closingLoginLabel: string
  heroTitle: string
  heroBody: string
  heroCards: LandingHeroCardModel[]
  heroStats: LandingHeroStatModel[]
  howTitle: string
  howSteps: readonly LandingHowStepModel[]
  filmTitle: string
  faqTitle: string
  faqItems: readonly LandingFaqItemModel[]
  heroVideo: HeroVideoModel
  loginButtonProps: LandingLoginButtonProps
  closingLoginButtonProps: LandingLoginButtonProps
  errorNoticeProps: LandingErrorNoticeProps
}

export function useLandingScreen(): LandingScreenModel {
  const { user } = useAuth()
  const heroVideo = useHeroVideo()
  const [snapshot, send] = useProjectedActor(interactiveLandingMachine)
  const ctx = snapshot.context
  const phase: LandingPhase = snapshot.matches('loggingIn')
    ? 'loggingIn'
    : snapshot.matches('loginError')
      ? 'loginError'
      : 'ready'

  const onLogin = () => send({ type: 'LOGIN' })

  return {
    phase,
    err: loginErrorCopy(ctx.err),
    showMarketplaceCta: !!user,
    showLoginButton: !user,
    showErr: !!ctx.err,
    loginLabel: ctx.busy ? copy.login.busyLabel : copy.login.label,
    loginAside: copy.hero.loginAside,
    marketplaceCta: copy.marketplaceCta,
    closingLine: user ? copy.closing.lineLoggedIn : copy.closing.lineLoggedOut,
    closingLoginLabel: ctx.busy ? copy.closing.busyLabel : copy.closing.label,
    heroTitle: copy.hero.title,
    heroBody: copy.hero.body,
    heroCards: buildLandingHeroCards(),
    heroStats: buildLandingHeroStats(),
    howTitle: copy.how.title,
    howSteps: buildLandingHowSteps(),
    filmTitle: copy.film.title,
    faqTitle: copy.faq.title,
    faqItems: buildLandingFaqItems(),
    heroVideo,
    loginButtonProps: {
      onClick: onLogin,
      disabled: ctx.busy,
      'aria-busy': ctx.busy,
      'aria-label': ctx.busy ? copy.login.busyName : copy.login.name,
    },
    closingLoginButtonProps: {
      onClick: onLogin,
      disabled: ctx.busy,
      'aria-busy': ctx.busy,
      'aria-label': ctx.busy ? copy.closing.busyName : copy.closing.name,
    },
    errorNoticeProps: { role: 'alert' },
  }
}
