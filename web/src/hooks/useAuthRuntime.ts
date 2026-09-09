import { useEffect } from 'react'
import { onFirebaseUser } from '../lib/firebase'
import { startPresence } from '../lib/presence'
import { useStores } from '../stores/StoresContext'
import { useMountEffect } from './useMountEffect'

/** Starts the auth machine and keeps Firebase presence. Mount once under StoresProvider. */
export function useAuthRuntime(): void {
  const { auth } = useStores()

  useMountEffect(() => {
    if (auth.snapshot.matches('idle')) void auth.refresh()
  })

  useEffect(() => {
    let stop: (() => void) | null = null
    const unsub = onFirebaseUser((fbUser) => {
      stop?.()
      stop = fbUser ? startPresence(fbUser.uid) : null
    })
    return () => {
      unsub()
      stop?.()
    }
  }, [])
}
