import { useProjectedActor } from './useProjectedActor'
import { autorun } from 'mobx'
import { useCallback, useRef, type ButtonHTMLAttributes, type ImgHTMLAttributes, type Ref } from 'react'
import { useNavigate, type LinkProps } from 'react-router-dom'
import { buildAlertsBellModel, type AlertsBellModel } from '../lib/alertsBellModel'
import { apiFetch, post } from '../lib/api'
import { buildQuestBarModel, type QuestBarModel } from '../lib/questBarModel'
import type { Alert, Meme, Me, QuestKey, QuestStep } from '../lib/types'
import { appShellMachine, type AppShellContext, type AppShellPhase } from '../stores/appShellMachine'
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
  showNav: boolean
  showToolbar: boolean
  coinsText: string
  avatar: {
    linkProps: Pick<LinkProps, 'to'>
    imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>
  } | null
  alertsBell: AlertsBellModel
  questBar: QuestBarModel | null
  logoutButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
}

export function buildAppShellScreenModel({
  phase,
  user,
  context,
  bellRef,
  onLogout,
  onClaimPack,
  onDismissPack,
  onOpenAlerts,
}: {
  phase: AppShellPhase
  user: Me | null
  context: AppShellContext
  bellRef?: Ref<HTMLDivElement> | undefined
  onLogout: () => void
  onClaimPack: () => void
  onDismissPack: () => void
  onOpenAlerts: (open: boolean) => void
}): AppShellScreenModel {
  const showQuest = (!!user && !allDone(user) && !!context.steps) || !!context.packMemes

  return {
    phase,
    showNav: !!user,
    showToolbar: !!user,
    coinsText: user ? `🧠 ${user.coins.toLocaleString()}` : '',
    avatar: user?.picture ? {
      linkProps: { to: `/u/${encodeURIComponent(user.sub)}` },
      imageProps: { src: user.picture, alt: user.name },
    } : null,
    alertsBell: buildAlertsBellModel({
      alerts: context.alerts,
      open: context.alertsOpen,
      onOpenChange: onOpenAlerts,
      rootRef: bellRef,
    }),
    questBar: showQuest ? buildQuestBarModel({
      steps: context.steps ?? [],
      packMemes: context.packMemes,
      packReward: context.packReward,
      busy: context.packBusy,
      onClaimPack,
      onDismissPack,
    }) : null,
    logoutButtonProps: { onClick: onLogout },
  }
}

/** Everything `AppShellScreen` renders. The hook is the engine; the screen is the terminal. */
export function useAppShellScreen(): AppShellScreenModel {
  const { user, logout, refresh } = useAuth()
  const { auth } = useStores()
  const navigate = useNavigate()
  const [snapshot, send, actor] = useProjectedActor(appShellMachine)
  const bellRef = useRef<HTMLDivElement>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as AppShellPhase

  useMountEffect(() => {
    let lastUser: Me | null | undefined
    let disposeLoads = () => {}

    const disposeUser = autorun(() => {
      const next = auth.user
      const done = allDone(next)
      if (next === lastUser) return
      lastUser = next
      disposeLoads()
      if (!next) {
        send({ type: 'LOGGED_OUT' })
        return
      }
      let live = true
      let poll: ReturnType<typeof setInterval> | null = null
      const loadAlerts = () => {
        if (!live) return
        void apiFetch<{ alerts: Alert[] }>('/api/alerts')
          .then((r) => { if (live) send({ type: 'SET_ALERTS', alerts: r.alerts }) })
          .catch(() => {})
      }
      const loadSteps = () => {
        if (!live) return
        void apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
          .then((r) => { if (live) send({ type: 'SET_STEPS', steps: r.steps }) })
          .catch(() => {})
      }
      disposeLoads = () => {
        live = false
        if (poll) clearInterval(poll)
        poll = null
      }
      send({ type: 'LOGGED_IN' })
      loadAlerts()
      if (!done) loadSteps()
      poll = setInterval(loadAlerts, POLL_MS)
    })

    const onClick = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) send({ type: 'CLOSE_ALERTS' })
    }
    document.addEventListener('mousedown', onClick)

    return () => {
      disposeUser()
      disposeLoads()
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

  return buildAppShellScreenModel({
    phase,
    user,
    context: ctx,
    bellRef,
    onLogout,
    onClaimPack: () => void onClaimPack(),
    onDismissPack: () => send({ type: 'DISMISS_PACK' }),
    onOpenAlerts: (open) => void onOpenAlerts(open),
  })
}
