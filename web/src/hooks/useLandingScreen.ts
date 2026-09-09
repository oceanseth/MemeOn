import { useProjectedActor } from './useProjectedActor'
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
} from 'react'
import { createElement } from 'react'
import { TIERS, type Tier } from '../../../shared/tiers'
import HeroVideo from '../components/HeroVideo'
import { apiFetch } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import {
  landingMachine,
  type LandingPhase,
} from '../stores/landingMachine'
import { useAuth } from './useAuth'
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
  /** the failed placeholder tints from the tier's own colour (index.css paints `currentColor`) */
  style: CSSProperties
}

export interface LandingTierModel extends Pick<Tier, 'key' | 'name' | 'color' | 'glowStyle' | 'hype'> {
  requirementLabel: string
}

/**
 * The ladder is fed the db `reshares` field, which the API surfaces as `views`
 * (`reshareCount` is the separate distinct-source stat), so views is the unit here.
 */
export function buildLandingTierModels(): LandingTierModel[] {
  return TIERS.map((tier) => ({
    key: tier.key,
    name: tier.name,
    color: tier.color,
    glowStyle: tier.glowStyle,
    hype: tier.hype,
    requirementLabel: `${tier.rarity} · ${tier.minReshares.toLocaleString()}+ views`,
  }))
}

/*
 * The bare foil frame from `/api/frames` is the ladder's image source. Composited demo
 * cards (the same house meme inside every foil) are a deferred asset: pointing at
 * `/brand/tier-demo/*.png` before they ship costs seven 404s and a two-stage paint.
 */

const LOGIN_ERROR_COPY = "Masky didn't answer. Tap Log in with Masky to try again."

/** Thrown strings never reach the page: one authored sentence that names the recovery. */
export function loginErrorCopy(err: string | null): string | null {
  return err ? LOGIN_ERROR_COPY : null
}

const interactiveLandingMachine = landingMachine.provide({
  actions: {
    startLogin: ({ self }) => {
      void beginMaskyLogin().catch((e) => {
        self.send({ type: 'FAIL', err: e instanceof Error ? e.message : 'login failed' })
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
  /** the FAQ is the most persuasive section, so the CTA repeats under it in the same state */
  closingLine: string
  closingLoginLabel: string
  hero: ReactNode
  tiers: LandingTierModel[]
  loginButtonProps: LandingLoginButtonProps
  closingLoginButtonProps: LandingLoginButtonProps
  frameImageProps: Record<string, LandingFrameImageProps | undefined>
  frameSlotProps: Record<string, LandingFrameSlotProps>
  errorNoticeProps: LandingErrorNoticeProps
}

/** Everything `LandingScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLandingScreen(): LandingScreenModel {
  const { user } = useAuth()
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
        style: { color: tier.color },
      } satisfies LandingFrameSlotProps,
    ]),
  )

  return {
    phase,
    err: loginErrorCopy(ctx.err),
    showMarketplaceCta: !!user,
    showLoginButton: !user,
    showErr: !!ctx.err,
    loginLabel: ctx.busy ? 'Redirecting…' : '🎭 Log in with Masky',
    closingLine: user ? 'Your binder is waiting.' : 'Ready? Your first pack is free.',
    closingLoginLabel: ctx.busy ? 'Redirecting…' : '🎭 Grab your pack with Masky',
    hero: createElement(HeroVideo),
    tiers: buildLandingTierModels(),
    loginButtonProps: {
      onClick: onLogin,
      disabled: ctx.busy,
      'aria-busy': ctx.busy,
      'aria-label': ctx.busy ? 'Redirecting to Masky' : 'Log in with Masky',
    },
    closingLoginButtonProps: {
      onClick: onLogin,
      disabled: ctx.busy,
      'aria-busy': ctx.busy,
      'aria-label': ctx.busy ? 'Redirecting to Masky for your pack' : 'Grab your pack with Masky',
    },
    frameImageProps,
    frameSlotProps,
    errorNoticeProps: { role: 'alert' },
  }
}
