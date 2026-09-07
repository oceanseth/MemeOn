import { autorun } from 'mobx'
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useStores } from '../stores/StoresContext'
import type { Me } from '../lib/types'

export interface AuthModel {
  user: Me | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
}

/**
 * Headless auth. Same fields AuthContext used to expose so pages do not change
 * in this slice. Subscribes through MobX; no observer() required on callers yet.
 */
export function useAuth(): AuthModel {
  const { auth } = useStores()
  const subscribe = useCallback(
    (onStoreChange: () => void) => autorun(() => {
      void auth.snapshot
      onStoreChange()
    }),
    [auth],
  )
  const getSnapshot = useCallback(() => auth.snapshot, [auth])
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return useMemo(
    () => ({
      user: auth.user,
      loading: auth.loading,
      refresh: () => auth.refresh(),
      logout: () => auth.logout(),
    }),
    [auth, auth.user, auth.loading, auth.snapshot],
  )
}
