import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, ApiError, clearTokens, loadTokens } from '../lib/api'
import type { Me } from '../lib/types'

interface AuthState {
  user: Me | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setUser(await apiFetch<Me>('/api/me'))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearTokens()
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const hasSession = await loadTokens()
      if (hasSession) await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const logout = useCallback(async () => {
    await clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthState => useContext(AuthContext)
