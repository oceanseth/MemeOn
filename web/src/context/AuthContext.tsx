import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, ApiError, clearSession, sessionToken } from '../lib/api'
import { firebaseSignOut, onFirebaseUser } from '../lib/firebase'
import { startPresence } from '../lib/presence'
import type { Me } from '../lib/types'

interface AuthState {
  user: Me | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!sessionToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await apiFetch<Me>('/api/me'))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession()
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    firebaseSignOut()
    setUser(null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // advertise online presence (RTDB) whenever Firebase auth is live
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

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthState => useContext(AuthContext)
