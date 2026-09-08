import { useMachine } from '@xstate/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import HeroVideo from '../components/HeroVideo'
import { apiFetch } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import {
  landingMachine,
  type LandingPhase,
} from '../stores/landingMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export interface LandingScreenModel {
  phase: LandingPhase
  frames: Record<string, string>
  busy: boolean
  err: string | null
  showMarketplaceCta: boolean
  showLoginButton: boolean
  showErr: boolean
  loginLabel: string
  hero: ReactNode
  onLogin: () => void
}

/** Everything `LandingScreen` renders. The hook is the engine; the screen is the terminal. */
export function useLandingScreen(): LandingScreenModel {
  const { user } = useAuth()
  const [snapshot, send] = useMachine(landingMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as LandingPhase

  useMountEffect(() => {
    apiFetch<{ frames: { key: string; url: string }[] }>('/api/frames')
      .then((r) => send({ type: 'SET_FRAMES', frames: Object.fromEntries(r.frames.map((f) => [f.key, f.url])) }))
      .catch(() => send({ type: 'SET_FRAMES', frames: {} }))
  })

  const onLogin = () => {
    send({ type: 'LOGIN' })
    void beginMaskyLogin().catch((e) => {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'login failed' })
    })
  }

  return {
    phase,
    frames: ctx.frames,
    busy: ctx.busy,
    err: ctx.err,
    showMarketplaceCta: !!user,
    showLoginButton: !user,
    showErr: !!ctx.err,
    loginLabel: ctx.busy ? 'Redirecting…' : '🎭 Log in with Masky',
    hero: createElement(HeroVideo),
    onLogin,
  }
}
