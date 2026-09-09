import { useProjectedActor } from './useProjectedActor'
import type { AnchorHTMLAttributes } from 'react'
import { apiFetch } from '../lib/api'
import {
  discordPageMachine,
  type DiscordPagePhase,
} from '../stores/discordPageMachine'
import { useMountEffect } from './useMountEffect'

export type DiscordInstallLinkProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'target' | 'rel' | 'aria-label'
>

export interface DiscordPageScreenModel {
  phase: DiscordPagePhase
  showInstall: boolean
  showPending: boolean
  installLinkProps: DiscordInstallLinkProps
}

/** Everything `DiscordPageScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDiscordPageScreen(): DiscordPageScreenModel {
  const [snapshot, send] = useProjectedActor(discordPageMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as DiscordPagePhase

  useMountEffect(() => {
    apiFetch<{ configured: boolean; installUrl: string | null }>('/api/discord/config')
      .then((r) => send({ type: 'DONE', installUrl: r.installUrl }))
      .catch(() => send({ type: 'DONE', installUrl: null }))
  })

  return {
    phase,
    showInstall: ctx.loaded && !!ctx.installUrl,
    showPending: ctx.loaded && !ctx.installUrl,
    installLinkProps: {
      href: ctx.installUrl ?? undefined,
      target: '_blank',
      rel: 'noreferrer',
      'aria-label': 'Add MemeOn to Discord (opens Discord in a new tab)',
    },
  }
}
