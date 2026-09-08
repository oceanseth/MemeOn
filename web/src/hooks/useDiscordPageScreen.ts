import { useMachine } from '@xstate/react'
import { apiFetch } from '../lib/api'
import {
  discordPageMachine,
  type DiscordPagePhase,
} from '../stores/discordPageMachine'
import { useMountEffect } from './useMountEffect'

export interface DiscordPageScreenModel {
  phase: DiscordPagePhase
  installUrl: string | null
  loaded: boolean
  showInstall: boolean
  showPending: boolean
}

/** Everything `DiscordPageScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDiscordPageScreen(): DiscordPageScreenModel {
  const [snapshot, send] = useMachine(discordPageMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as DiscordPagePhase

  useMountEffect(() => {
    apiFetch<{ configured: boolean; installUrl: string | null }>('/api/discord/config')
      .then((r) => send({ type: 'DONE', installUrl: r.installUrl }))
      .catch(() => send({ type: 'DONE', installUrl: null }))
  })

  return {
    phase,
    installUrl: ctx.installUrl,
    loaded: ctx.loaded,
    showInstall: ctx.loaded && !!ctx.installUrl,
    showPending: ctx.loaded && !ctx.installUrl,
  }
}
