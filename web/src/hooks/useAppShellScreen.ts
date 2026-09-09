import { useProjectedActor } from './useProjectedActor'
import { autorun } from 'mobx'
import {
  useCallback,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ImgHTMLAttributes,
  type Ref,
} from 'react'
import { useNavigate, type LinkProps } from 'react-router-dom'
import { buildAlertsBellModel, type AlertsBellModel } from '../lib/alertsBellModel'
import { apiFetch, post } from '../lib/api'
import { avatarErrorHandler } from '../lib/avatarModel'
import { buildQuestBarModel, type QuestBarModel } from '../lib/questBarModel'
import type { Alert, Meme, Me, QuestKey, QuestStep } from '../lib/types'
import { appShellMachine, type AppShellContext, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

const POLL_MS = 30_000
const QUEST_KEYS: QuestKey[] = ['pack', 'mint', 'share', 'friend', 'trade']

const NAV_ITEMS: { to: string; label: string; emoji: string | null }[] = [
  { to: '/marketplace', label: 'Marketplace', emoji: null },
  { to: '/binder', label: 'My Binder', emoji: null },
  { to: '/friends', label: 'Friends', emoji: null },
  { to: '/trade', label: 'Trade', emoji: null },
  { to: '/leaderboard', label: 'Top Brains', emoji: '🏆' },
]

function allDone(user: Me | null): boolean {
  return !!user && !!user.onboarding && QUEST_KEYS.every((k) => user.onboarding?.[k])
}

export interface AppShellScreenModel {
  phase: AppShellPhase
  showNav: boolean
  showToolbar: boolean
  navItems: { to: string; label: string; emoji: string | null }[]
  /** The gold figure and the name it announces: a span takes no name from a title. */
  coins: { text: string; label: string } | null
  avatar: {
    linkProps: Pick<LinkProps, 'to'> & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-label'>
    imageProps: Pick<
      ImgHTMLAttributes<HTMLImageElement>,
      'src' | 'alt' | 'referrerPolicy' | 'onError'
    >
  } | null
  alertsBell: AlertsBellModel
  questBar: QuestBarModel | null
  logoutButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
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
  onToggleQuests = () => {},
  onDismissQuests = () => {},
}: {
  phase: AppShellPhase
  user: Me | null
  context: AppShellContext
  bellRef?: Ref<HTMLDivElement> | undefined
  onLogout: () => void
  onClaimPack: () => void
  onDismissPack: () => void
  onOpenAlerts: (open: boolean) => void
  onToggleQuests?: () => void
  onDismissQuests?: () => void
}): AppShellScreenModel {
  const steps = context.questDismissed ? [] : context.steps ?? []
  const showQuest = (!!user && !allDone(user) && steps.length > 0) || !!context.packMemes

  return {
    phase,
    showNav: !!user,
    showToolbar: !!user,
    navItems: NAV_ITEMS,
    coins: user
      ? {
          text: `🧠 ${user.coins.toLocaleString()}`,
          label: `${user.coins.toLocaleString()} braincells`,
        }
      : null,
    avatar: user?.picture ? {
      linkProps: { to: `/u/${encodeURIComponent(user.sub)}`, 'aria-label': 'Your profile' },
      imageProps: {
        src: user.picture,
        alt: '',
        referrerPolicy: 'no-referrer',
        /* third-party avatar hosts 404: the slot keeps its shape and stays *your* monogram,
           never the MemeOn mark, which is a different identity in the same 32px circle */
        onError: avatarErrorHandler(user.name),
      },
    } : null,
    alertsBell: buildAlertsBellModel({
      alerts: context.alerts,
      open: context.alertsOpen,
      onOpenChange: onOpenAlerts,
      rootRef: bellRef,
      wasUnread: context.wasUnread,
      failed: context.alertsError,
    }),
    questBar: showQuest ? buildQuestBarModel({
      steps,
      packMemes: context.packMemes,
      packReward: context.packReward,
      busy: context.packBusy,
      claimError: context.claimError,
      expanded: context.questExpanded,
      onClaimPack,
      onDismissPack,
      onToggleSteps: onToggleQuests,
      onDismissSteps: onDismissQuests,
    }) : null,
    logoutButtonProps: { onClick: onLogout, 'aria-label': 'Log out' },
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
    let refetchOnVisible = () => {}

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
          .catch(() => { if (live) send({ type: 'SET_ALERTS_FAIL' }) })
      }
      const loadSteps = () => {
        if (!live) return
        void apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
          .then((r) => { if (live) send({ type: 'SET_STEPS', steps: r.steps }) })
          .catch(() => {})
      }
      /* a hidden tab is not a reader: skip its ticks and catch up when it comes back */
      refetchOnVisible = () => { if (document.visibilityState === 'visible') loadAlerts() }
      disposeLoads = () => {
        live = false
        refetchOnVisible = () => {}
        if (poll) clearInterval(poll)
        poll = null
      }
      send({ type: 'LOGGED_IN' })
      loadAlerts()
      if (!done) loadSteps()
      poll = setInterval(() => {
        if (document.visibilityState === 'visible') loadAlerts()
      }, POLL_MS)
    })

    const onVisibility = () => refetchOnVisible()
    document.addEventListener('visibilitychange', onVisibility)

    const onClick = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) send({ type: 'CLOSE_ALERTS' })
    }
    document.addEventListener('mousedown', onClick)

    return () => {
      disposeUser()
      disposeLoads()
      document.removeEventListener('visibilitychange', onVisibility)
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
        const ids = unread.map((a) => a.id)
        await post('/api/alerts/read', { ids }).catch(() => {})
        /* the ids stay marked in this session so the gesture that reveals them does not erase them */
        send({ type: 'MARK_READ', ids })
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
    onToggleQuests: () => send({ type: 'TOGGLE_QUESTS' }),
    onDismissQuests: () => send({ type: 'DISMISS_QUESTS' }),
  })
}
