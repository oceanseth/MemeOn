import { useProjectedActor } from './useProjectedActor'
import type {
  ButtonHTMLAttributes,
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

export interface LandingTierModel extends Pick<Tier, 'key' | 'name' | 'color' | 'glowStyle' | 'hype'> {
  requirementLabel: string
}

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
  hero: ReactNode
  tiers: LandingTierModel[]
  loginButtonProps: LandingLoginButtonProps
  frameImageProps: Record<string, LandingFrameImageProps | undefined>
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

  const hideBrokenFrame: NonNullable<LandingFrameImageProps['onError']> = (event) => {
    event.currentTarget.style.display = 'none'
  }

  const frameImageProps: LandingScreenModel['frameImageProps'] = Object.fromEntries(
    Object.entries(ctx.frames).map(([key, src]) => [
      key,
      {
        src,
        alt: `${TIERS.find((tier) => tier.key === key)?.name ?? key} frame`,
        loading: 'lazy',
        onError: hideBrokenFrame,
      },
    ]),
  )

  return {
    phase,
    err: ctx.err,
    showMarketplaceCta: !!user,
    showLoginButton: !user,
    showErr: !!ctx.err,
    loginLabel: ctx.busy ? 'Redirecting…' : '🎭 Log in with Masky',
    hero: createElement(HeroVideo),
    tiers: buildLandingTierModels(),
    loginButtonProps: {
      onClick: onLogin,
      disabled: ctx.busy,
      'aria-busy': ctx.busy,
      'aria-label': ctx.busy ? 'Redirecting to Masky' : 'Log in with Masky',
    },
    frameImageProps,
    errorNoticeProps: { role: 'alert' },
  }
}
