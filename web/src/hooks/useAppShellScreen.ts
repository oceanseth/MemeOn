import { useMachine } from '@xstate/react'
import { autorun } from 'mobx'
import { useCallback, useRef, type Ref } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Alert, Meme, Me, QuestKey, QuestStep } from '../lib/types'
import { appShellMachine, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

const POLL_MS = 30_000
const QUEST_KEYS: QuestKey[] = ['pack', 'mint', 'share', 'friend', 'trade']

function allDone(user: Me | null): boolean {
  return !!user && !!user.onboarding && QUEST_KEYS.every((k) => user.onboarding?.[k])
}

export interface AppShellScreenModel {
  phase: AppShellPhase
  user: Me | null
  steps: QuestStep[] | null
  packMemes: Meme[] | null
  packReward: number
  packBusy: boolean
  alerts: Alert[]
  alertsOpen: boolean
  showNav: boolean
  showToolbar: boolean
  showAvatar: boolean
  showQuest: boolean
  coinsText: string
  profileHref: string
  bellRef: Ref<HTMLDivElement>
  onLogout: () => void
  onClaimPack: () => void
  onDismissPack: () => void
  onOpenAlerts: (open: boolean) => void
}

/** Everything `AppShellScreen` renders. The hook is the engine; the screen is the terminal. */
export function useAppShellScreen(): AppShellScreenModel {
  const { user, logout, refresh } = useAuth()
  const { auth } = useStores()
  const navigate = useNavigate()
  const [snapshot, send, actor] = useMachine(appShellMachine)
  const bellRef = useRef<HTMLDivElement>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as AppShellPhase

  useMountEffect(() => {
    let lastUser: Me | null | undefined
    let poll: ReturnType<typeof setInterval> | null = null

    const loadAlerts = () =>
      apiFetch<{ alerts: Alert[] }>('/api/alerts')
        .then((r) => send({ type: 'SET_ALERTS', alerts: r.alerts }))
        .catch(() => {})

    const loadSteps = () =>
      apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
        .then((r) => send({ type: 'SET_STEPS', steps: r.steps }))
        .catch(() => {})

    const disposeUser = autorun(() => {
      const next = auth.user
      const done = allDone(next)
      if (next === lastUser) return
      lastUser = next
      if (poll) {
        clearInterval(poll)
        poll = null
      }
      if (!next) {
        send({ type: 'LOGGED_OUT' })
        return
      }
      send({ type: 'LOGGED_IN' })
      void loadAlerts()
      if (!done) void loadSteps()
      poll = setInterval(() => void loadAlerts(), POLL_MS)
    })

    const onClick = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) send({ type: 'CLOSE_ALERTS' })
    }
    document.addEventListener('mousedown', onClick)

    return () => {
      disposeUser()
      if (poll) clearInterval(poll)
      document.removeEventListener('mousedown', onClick)
    }
  })

  const onClaimPack = useCallback(async () => {
    send({ type: 'CLAIM_START' })
    try {
      const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
      send({ type: 'CLAIM_DONE', memes: out.memes, reward: out.reward })
      void refresh()
    } catch {
      send({ type: 'CLAIM_FAIL' })
    }
  }, [refresh, send])

  const onOpenAlerts = useCallback(
    async (next: boolean) => {
      send({ type: next ? 'OPEN_ALERTS' : 'CLOSE_ALERTS' })
      const unread = actor.getSnapshot().context.alerts.filter((a) => !a.read)
      if (next && unread.length > 0) {
        await post('/api/alerts/read', { ids: unread.map((a) => a.id) }).catch(() => {})
        send({ type: 'MARK_READ' })
        void refresh()
      }
    },
    [actor, refresh, send],
  )

  const onLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const showQuest = (!!user && !allDone(user) && !!ctx.steps) || !!ctx.packMemes

  return {
    phase,
    user,
    steps: ctx.steps,
    packMemes: ctx.packMemes,
    packReward: ctx.packReward,
    packBusy: ctx.packBusy,
    alerts: ctx.alerts,
    alertsOpen: ctx.alertsOpen,
    showNav: !!user,
    showToolbar: !!user,
    showAvatar: !!user?.picture,
    showQuest,
    coinsText: user ? `🧠 ${user.coins.toLocaleString()}` : '',
    profileHref: user ? `/u/${encodeURIComponent(user.sub)}` : '',
    bellRef,
    onLogout,
    onClaimPack: () => void onClaimPack(),
    onDismissPack: () => send({ type: 'DISMISS_PACK' }),
    onOpenAlerts: (open) => void onOpenAlerts(open),
  }
}
