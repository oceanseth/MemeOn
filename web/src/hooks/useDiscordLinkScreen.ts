import { useMachine } from '@xstate/react'
import { autorun } from 'mobx'
import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import {
  discordLinkMachine,
  type DiscordLinkPhase,
} from '../stores/discordLinkMachine'
import { useStores } from '../stores/StoresContext'
import { useMountEffect } from './useMountEffect'

export const DISCORD_LINK_KEY = 'memeon_discord_link_token'

export interface DiscordLinkScreenModel {
  phase: DiscordLinkPhase
  err: string | null
  showWorking: boolean
  showDone: boolean
  showError: boolean
}

/** Everything `DiscordLinkScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDiscordLinkScreen(): DiscordLinkScreenModel {
  const [params] = useSearchParams()
  const { auth } = useStores()
  const [snapshot, send] = useMachine(discordLinkMachine)
  const ran = useRef(false)
  const ctx = snapshot.context
  const phase = snapshot.value as DiscordLinkPhase

  useMountEffect(() => {
    const tokenAtMount = params.get('token') ?? sessionStorage.getItem(DISCORD_LINK_KEY)
    const dispose = autorun(() => {
      if (auth.loading || ran.current) return
      const token = tokenAtMount ?? params.get('token') ?? sessionStorage.getItem(DISCORD_LINK_KEY)
      if (!token) {
        send({ type: 'FAIL', err: 'missing link token — run /memeon-connect in Discord again' })
        return
      }
      const user = auth.user
      if (!user) {
        sessionStorage.setItem(DISCORD_LINK_KEY, token)
        sessionStorage.setItem('memeon_post_login', '/discord/link')
        void beginMaskyLogin().catch(() => {
          send({ type: 'FAIL', err: 'login failed — try again' })
        })
        return
      }
      ran.current = true
      sessionStorage.removeItem(DISCORD_LINK_KEY)
      post('/api/discord/link', { token })
        .then(() => send({ type: 'DONE' }))
        .catch((e) => {
          send({ type: 'FAIL', err: e instanceof Error ? e.message : 'linking failed' })
        })
    })
    return dispose
  })

  return {
    phase,
    err: ctx.err,
    showWorking: phase === 'working',
    showDone: phase === 'done',
    showError: phase === 'error',
  }
}
