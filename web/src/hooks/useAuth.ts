import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { sharedCopy } from '../copy/shared'
import { useStores } from '../stores/StoresContext'
import type { Me } from '../lib/types'

export interface AuthModel {
  user: Me | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => void
  checkingSessionLabel: string
}

/** Auth state and actions, subscribed through the actor snapshot projection. */
export function useAuth(): AuthModel {
  const { auth } = useStores()
  const subscribe = useCallback(
    (onStoreChange: () => void) => auth.subscribe(onStoreChange),
    [auth],
  )
  const getSnapshot = useCallback(() => auth.getSnapshot(), [auth])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return useMemo(
    () => ({
      user: auth.user,
      loading: auth.loading,
      error: auth.error,
      refresh: () => auth.refresh(),
      logout: () => auth.logout(),
      checkingSessionLabel: sharedCopy.checkingSession,
    }),
    [auth, snapshot, auth.user, auth.loading, auth.error],
  )
}
