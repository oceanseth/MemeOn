import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { forwardToDeepLink } from '../lib/authNavigation'
import type { AuthStatusScreenModel } from './useAuthCallbackScreen'

/**
 * Masky OAuth only allows https redirect URIs, so the mobile app uses `https://{host}/auth/mobile`
 * as its redirect target. This route immediately forwards the code/state into the app through the
 * `memeon://` deep link and keeps a tappable copy of it on screen for the browsers that swallow the
 * automatic one.
 */
export function useMobileAuthForwardScreen(): AuthStatusScreenModel {
  const [params] = useSearchParams()

  const deepLink = useMemo(() => {
    const q = new URLSearchParams()
    for (const key of ['code', 'state', 'error']) {
      const v = params.get(key)
      if (v) q.set(key, v)
    }
    return `memeon://auth?${q.toString()}`
  }, [params])

  useEffect(() => {
    forwardToDeepLink(deepLink)
  }, [deepLink])

  return {
    phase: 'working',
    title: 'Returning to the MemeOn app…',
    subtitle: 'Open the MemeOn app, or keep going on the web.',
    error: null,
    // Page primary uses Central arrow icon, not emoji
    primaryAction: { label: 'Open MemeOn', href: deepLink, icon: 'arrow-right' },
    fallback: {
      prompt: 'Nothing happened?',
      retry: null,
      home: { label: 'Continue on the web', to: '/' },
    },
  }
}
