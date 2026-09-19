import { useProjectedActor } from './useProjectedActor'
import { useCallback, type MouseEventHandler } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadAlerts, loadAlertsIfVisible, openAlerts, POLL_MS } from '../lib/appShellAlerts'
import {
  allDone,
  buildAppShellScreenModel,
  type AppShellScreenModel,
} from '../lib/appShellModel'
import {
  claimOnboardingPack,
  dismissPack,
  dismissQuests,
  loadOnboardingSteps,
} from '../lib/appShellQuests'
import type { Me } from '../lib/types'
import { withViewTransition } from '../lib/viewTransition'
import { appShellMachine, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useTheme } from './useTheme'

export type {
  AppShellScreenModel,
  RouteFamily,
  ShellLinkProps,
  ShellNavItem,
  ShellTabItem,
} from '../lib/appShellModel'
export { buildAppShellScreenModel, routeFamily } from '../lib/appShellModel'

/** Everything `AppShellScreen` renders. The hook is the engine; the screen is the terminal. */
export function useAppShellScreen(): AppShellScreenModel {
  const { user, logout, refresh } = useAuth()
  const { auth } = useStores()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [snapshot, send, actor] = useProjectedActor(appShellMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as AppShellPhase

  useMountEffect(() => {
    let lastUser: Me | null | undefined
    let disposeLoads = () => {}
    let refetchOnVisible = () => {}

    const onUserChange = () => {
      const next = auth.user
      if (next === lastUser) return
      lastUser = next
      disposeLoads()
      if (!next) {
        send({ type: 'LOGGED_OUT' })
        return
      }
      const live = { current: true }
      let poll: ReturnType<typeof setInterval> | null = null
      const io = { live, send }
      /* a hidden tab is not a reader: skip its ticks and catch up when it comes back */
      refetchOnVisible = () => loadAlertsIfVisible(io)
      disposeLoads = () => {
        live.current = false
        refetchOnVisible = () => {}
        if (poll) clearInterval(poll)
        poll = null
      }
      send({ type: 'LOGGED_IN' })
      loadAlerts(io)
      if (!allDone(next)) loadOnboardingSteps(io)
      poll = setInterval(() => loadAlertsIfVisible(io), POLL_MS)
    }
    onUserChange()
    const disposeUser = auth.subscribe(onUserChange)

    const onVisibility = () => refetchOnVisible()
    document.addEventListener('visibilitychange', onVisibility)

    /* Base UI's Popover owns dismissal now — an outside press, Escape and a focus-out all arrive
       through `onOpenChange`, so the shell no longer watches the document for stray clicks. */
    return () => {
      disposeUser()
      disposeLoads()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  const onLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  /*
   * A chrome link navigates inside a View Transition: the old frame is captured, the route swaps
   * synchronously, and the browser tweens between them (`organisms/app-shell.css` names what holds
   * still and what glides). A modified click or a non-primary button is the browser's — a new tab,
   * a context menu — so those fall through to the plain anchor. `BrowserRouter` has no data-router
   * `viewTransition` prop, which is why the hook wraps `navigate` itself.
   */
  const onNavigate = useCallback(
    (to: string): MouseEventHandler<HTMLAnchorElement> =>
      (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        )
          return
        event.preventDefault()
        withViewTransition(() => flushSync(() => navigate(to, { replace: to === pathname })))
      },
    [navigate, pathname],
  )

  return buildAppShellScreenModel({
    phase,
    user,
    context: ctx,
    pathname,
    theme: { value: preference, onChange: setPreference },
    onLogout,
    onClaimPack: () => void claimOnboardingPack({ send, refresh }),
    onDismissPack: () => dismissPack(send),
    onOpenAlerts: (open) => void openAlerts({ open, send, actor, refresh }),
    onDismissQuests: () => dismissQuests(send),
    onNavigate,
  })
}
