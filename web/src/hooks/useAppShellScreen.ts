import { useProjectedActor } from './useProjectedActor'
import { useCallback, type MouseEventHandler } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  allDone,
  buildAppShellScreenModel,
  type AppShellScreenModel,
} from '../lib/appShellModel'
import type { Me } from '../lib/types'
import { withViewTransition } from '../lib/viewTransition'
import { appShellMachine, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAppShellAlerts } from './useAppShellAlerts'
import { useAppShellQuests } from './useAppShellQuests'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useTheme } from './useTheme'

export {
  buildAppShellChrome,
  buildAppShellScreenModel,
  routeFamily,
  type AppShellScreenModel,
  type RouteFamily,
  type ShellLinkProps,
  type ShellNavItem,
  type ShellTabItem,
} from '../lib/appShellModel'

const POLL_MS = 30_000

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
  const { loadAlerts, onOpenAlerts } = useAppShellAlerts({ send, actor, refresh })
  const { loadSteps, onClaimPack, onDismissPack, onDismissQuests } = useAppShellQuests({ send, refresh })

  useMountEffect(() => {
    let lastUser: Me | null | undefined
    let disposeLoads = () => {}
    let refetchOnVisible = () => {}

    const onUserChange = () => {
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
      const isLive = () => live
      /* a hidden tab is not a reader: skip its ticks and catch up when it comes back */
      refetchOnVisible = () => { if (document.visibilityState === 'visible') loadAlerts(isLive) }
      disposeLoads = () => {
        live = false
        refetchOnVisible = () => {}
        if (poll) clearInterval(poll)
        poll = null
      }
      send({ type: 'LOGGED_IN' })
      loadAlerts(isLive)
      if (!done) loadSteps(isLive)
      poll = setInterval(() => {
        if (document.visibilityState === 'visible') loadAlerts(isLive)
      }, POLL_MS)
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
    onClaimPack: () => void onClaimPack(),
    onDismissPack,
    onOpenAlerts: (open) => void onOpenAlerts(open),
    onDismissQuests,
    onNavigate,
  })
}
