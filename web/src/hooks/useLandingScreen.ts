import { useProjectedActor } from './useProjectedActor'
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
} from 'react'
import { TIERS, type Tier } from '@memeon/shared/tiers'
import { landingCopy } from '../copy/landing'
import { apiFetch } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import type { HeroVideoModel } from '../lib/heroVideoModel'
import {
  landingMachine,
  type LandingPhase,
} from '../stores/landingMachine'
import { useAuth } from './useAuth'
import { useHeroVideo } from './useHeroVideo'
import { useMountEffect } from './useMountEffect'

export type LandingLoginButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy' | 'aria-label'
>

export type LandingFrameImageProps = Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'loading' | 'onError'
>

export type LandingErrorNoticeProps = Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>

/** The slot owns the box in all three outcomes, so the ladder never resizes under the reader. */
export type LandingFrameSlotState = 'loading' | 'ready' | 'error'

export interface LandingFrameSlotProps {
  'data-state': LandingFrameSlotState
  /**
   * The failed placeholder tints from the tier's own frame token (`LandingScreen.css` paints
   * `currentColor`). A token, never `shared/tiers`' hex — that ramp is tuned for the API's dark
   * OG frames and is unreadable on the light canvas.
   */
  style: CSSProperties
}

export interface LandingTierModel extends Pick<Tier, 'key' | 'name' | 'glowStyle'> {
  /** Ladder card middle line: "0 reshares" … "25,000 reshares". */
  resharesLabel: string
  /** Rarity caption under the reshare count. */
  rarityLabel: string
}

/** One tilted card in the hero pile. */
export interface LandingHeroCardModel extends Pick<Tier, 'glowStyle'> {
  tierKey: string
  tierName: string
  /** Meme title lettered on the tilted card. */
  caption: string
}

const copy = landingCopy

/** Tier thresholds are reshare counts from the db `reshares` field. */
export function buildLandingTierModels(): LandingTierModel[] {
  return TIERS.map((tier) => ({
    key: tier.key,
    name: tier.name,
    glowStyle: tier.glowStyle,
    resharesLabel: copy.tier.reshares(tier.minReshares),
    rarityLabel: tier.rarity,
  }))
}

/* Hero pile is three tiers (Gold, Silver, Prismatic), not the full ladder. */
const HERO_PILE: { tierKey: string; caption: string }[] = [
  { tierKey: 'gold', caption: copy.heroCaptions.gold },
  { tierKey: 'silver', caption: copy.heroCaptions.silver },
  { tierKey: 'prismatic', caption: copy.heroCaptions.prismatic },
]

export function buildLandingHeroCards(): LandingHeroCardModel[] {
  return HERO_PILE.map(({ tierKey, caption }) => {
    const tier = TIERS.find((candidate) => candidate.key === tierKey)
    return {
      tierKey,
      tierName: tier?.name ?? tierKey,
      glowStyle: tier?.glowStyle ?? 'graphite-gradient-still',
      caption,
    }
  })
}

/*
 * The bare foil frame from `/api/frames` is the art of both the ladder and the hero pile.
 * Composited demo cards (the same house meme inside every foil) are a deferred asset: pointing at
 * `/brand/tier-demo/*.png` before they ship costs seven 404s and a two-stage paint.
 */

/** Thrown strings never reach the page: one authored sentence that names the recovery. */
export function loginErrorCopy(err: string | null): string | null {
  return err ? copy.errors.login : null
}

const interactiveLandingMachine = landingMachine.provide({
  actions: {
    startLogin: ({ self }) => {
      void beginMaskyLogin().catch((e) => {
        /* the machine's err only flags the failure: `loginErrorCopy` replaces it before render */
        self.send({ type: 'FAIL', err: e instanceof Error ? e.message : copy.machine.loginFailed })
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
  /** the closing card's line; the page finishes convincing there, so the CTA repeats under it */
  closingLine: string
  closingLoginLabel: string
  /** the hero's trading-card pile */
  heroCards: LandingHeroCardModel[]
  tiers: LandingTierModel[]
  /** the promo film, between the ladder and the FAQ */
  heroVideo: HeroVideoModel
  loginButtonProps: LandingLoginButtonProps
  closingLoginButtonProps: LandingLoginButtonProps
  frameImageProps: Record<string, LandingFrameImageProps | undefined>
  frameSlotProps: Record<string, LandingFrameSlotProps>
  errorNoticeProps: LandingErrorNoticeProps
}

/** Everything `LandingScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLandingScreen(): LandingScreenModel {
  const { user } = useAuth()
  const heroVideo = useHeroVideo()
  const [snapshot, send] = useProjectedActor(interactiveLandingMachine)
  const ctx = snapshot.context
  const phase: LandingPhase = snapshot.matches({ login: 'loggingIn' })
    ? 'loggingIn'
    : snapshot.matches({ login: 'loginError' })
      ? 'loginError'
      : snapshot.matches({ frames: 'loading' })
        ? 'loading'
        : 'ready'

  useMountEffect(() => {
    apiFetch<{ frames: { key: string; url: string }[] }>('/api/frames')
      .then((r) => send({ type: 'SET_FRAMES', frames: Object.fromEntries(r.frames.map((f) => [f.key, f.url])) }))
      .catch(() => send({ type: 'SET_FRAMES', frames: {} }))
  })

  const onLogin = () => {
    send({ type: 'LOGIN' })
  }

  /* login activity must not mask frame readiness: the two regions settle independently */
  const framesReady = snapshot.matches({ frames: 'ready' })

  const frameImageProps: LandingScreenModel['frameImageProps'] = Object.fromEntries(
    TIERS.map((tier) => {
      const bareFrame = ctx.frames[tier.key]
      const src = !framesReady || ctx.brokenFrames.includes(tier.key) ? undefined : bareFrame
      if (!src) return [tier.key, undefined]
      return [
        tier.key,
        {
          src,
          // decorative: the tier name beside it is the announced label
          alt: '',
          loading: 'lazy',
          onError: () => send({ type: 'FRAME_FAILED', key: tier.key }),
        } satisfies LandingFrameImageProps,
      ]
    }),
  )

  const frameSlotProps: LandingScreenModel['frameSlotProps'] = Object.fromEntries(
    TIERS.map((tier) => [
      tier.key,
      {
        'data-state': !framesReady ? 'loading' : frameImageProps[tier.key] ? 'ready' : 'error',
        style: { color: `var(--color-tier-${tier.key}-frame)` },
      } satisfies LandingFrameSlotProps,
    ]),
  )

  return {
    phase,
    err: loginErrorCopy(ctx.err),
    showMarketplaceCta: !!user,
    showLoginButton: !user,
    showErr: !!ctx.err,
    loginLabel: ctx.busy ? copy.login.busyLabel : copy.login.label,
    closingLine: user ? copy.closing.lineLoggedIn : copy.closing.lineLoggedOut,
    closingLoginLabel: ctx.busy ? copy.closing.busyLabel : copy.closing.label,
    heroCards: buildLandingHeroCards(),
    tiers: buildLandingTierModels(),
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
    frameImageProps,
    frameSlotProps,
    errorNoticeProps: { role: 'alert' },
  }
}
