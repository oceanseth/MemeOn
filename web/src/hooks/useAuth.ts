import { autorun } from 'mobx'
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useStores } from '../stores/StoresContext'
import type { Me } from '../lib/types'

export interface AuthModel {
  user: Me | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => void
}

/** Auth state and actions, subscribed through the MobX snapshot projection. */
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
      error: auth.error,
      refresh: () => auth.refresh(),
      logout: () => auth.logout(),
    }),
    [auth, auth.user, auth.loading, auth.error, auth.snapshot],
  )
}
