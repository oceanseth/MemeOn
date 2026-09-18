import { useProjectedActor } from './useProjectedActor'
import type { AnchorHTMLAttributes } from 'react'
import { discordPageCopy } from '../copy/discordPage'
import { apiFetch } from '../lib/api'
import {
  discordPageMachine,
  type DiscordPagePhase,
} from '../stores/discordPageMachine'
import { useMountEffect } from './useMountEffect'

export type DiscordInstallLinkProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'target' | 'rel'
>

export interface DiscordPageScreenModel {
  phase: DiscordPagePhase
  showLoading: boolean
  showInstall: boolean
  showPending: boolean
  showError: boolean
  /** first sentence of the install steps: the FAQ may not point at a button that is not there */
  installSteps: string
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
      .catch(() => send({ type: 'FAIL' }))
  })

  const showInstall = phase === 'ready' && !!ctx.installUrl

  return {
    phase,
    showLoading: phase === 'loading',
    showInstall,
    showPending: phase === 'ready' && !ctx.installUrl,
    showError: phase === 'errored',
    installSteps: showInstall ? discordPageCopy.installSteps.live : discordPageCopy.installSteps.pending,
    installLinkProps: {
      href: ctx.installUrl ?? undefined,
      target: '_blank',
      rel: 'noreferrer',
    },
  }
}
