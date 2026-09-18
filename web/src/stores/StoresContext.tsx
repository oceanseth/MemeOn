import { createContext, useContext, type ReactNode } from 'react'
import type { AppStores } from './createStores'

const StoresContext = createContext<AppStores | null>(null)

export function StoresProvider({
  stores,
  children,
}: {
  stores: AppStores
  children: ReactNode
}) {
  return <StoresContext.Provider value={stores}>{children}</StoresContext.Provider>
}

export function useStores(): AppStores {
  const stores = useContext(StoresContext)
  if (!stores) throw new Error('useStores must be used inside StoresProvider')
  return stores
}
