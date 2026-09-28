import { TIERS } from '@memeon/shared/tiers'
import type { ButtonHTMLAttributes, HTMLAttributes, ImgHTMLAttributes, RefCallback } from 'react'
import { landingCopy } from '../copy/landing'
import { beginMaskyLogin } from '../lib/auth'
import { humanize } from '../lib/humanize'
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
  'src' | 'alt' | 'loading'
>

export type LandingErrorNoticeProps = Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>

export interface LandingHeroCardModel {
  tierKey: string
  /** The card's seat on the hero stage: 0 at the centre, negative to the left (`data-seat`). */
  seat: number
  tierName: string
  tierLabel: string
  resharesLabel: string
  rarityLabel: string
  imageProps: LandingHeroImageProps
  /** the art window's ratio: the image's own, so the art covers the window edge to edge */
  aspect: number
  cardRef: RefCallback<HTMLElement>
}

export interface LandingHeroStatModel {
  key: string
  /** Compact magnitude (`25k`), exact under 1,000. */
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
/** `public/brand/hero-cat.webp` is 1254 × 1254 */
const HERO_IMAGE_ASPECT = 1254 / 1254
/** Every minted meme is one hundred shares (`api`); the landing quotes it. */
const SHARES_PER_CARD = 100

/** The top of the ladder on stage: the best tier at the centre seat, its runners-up beside it —
 *  third-best left, second-best right — drifting on the float loop (`landing-hero.css`). The
 *  lower four tiers stay off the hero; the ladder itself is still quoted by the stats row. */
export function buildLandingHeroCards(): LandingHeroCardModel[] {
  const [third, second, top] = TIERS.slice(-3)
  if (!third || !second || !top) throw new Error('TIERS holds fewer than three tiers')
  const seated = [
    { tier: third, seat: -1 },
    { tier: top, seat: 0 },
    { tier: second, seat: 1 },
  ]
  return seated.map(({ tier, seat }) => ({
    tierKey: tier.key,
    seat,
    tierName: tier.name,
    tierLabel: `${tier.name} · ${tier.rarity}`,
    resharesLabel: copy.tier.reshares(tier.minReshares),
    rarityLabel: tier.rarity,
    imageProps: { src: HERO_IMAGE_SRC, alt: '', loading: 'eager' },
    aspect: HERO_IMAGE_ASPECT,
    cardRef: cardMediaRef,
  }))
}

/** Tiers, shares a card, and the reshares the top tier asks for: all read off the ladder. */
export function buildLandingHeroStats(): LandingHeroStatModel[] {
  const top = TIERS[TIERS.length - 1]
  if (!top) throw new Error('TIERS is empty')
  return [
    { key: 'tiers', value: humanize(TIERS.length), label: copy.hero.stats.tiers },
    { key: 'shares', value: humanize(SHARES_PER_CARD), label: copy.hero.stats.shares },
    {
      key: 'reshares',
      value: humanize(top.minReshares),
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
