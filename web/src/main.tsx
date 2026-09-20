// First import, always: a cascade layer's rank is fixed the first time its name is seen, so the
// order statement in `index.css` has to reach the bundle ahead of every component's `@layer` block.
import './index.css'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { PopmeltProvider } from '@popmelt.com/core'
import { AppView } from './views/AppView'
import { useAuthRuntime } from './hooks/useAuthRuntime'
import { useMountEffect } from './hooks/useMountEffect'
import { createStores } from './stores/createStores'
import { StoresProvider } from './stores/StoresContext'

// The one app bag. Constructed here rather than in render so the persisted theme can land on
// <html> synchronously, before React paints a frame in the wrong arm; retained on committed mount
// like every other owner.
const stores = createStores()
stores.theme.apply()

function AuthRuntime() {
  useAuthRuntime()
  return null
}

function PopmeltRoot({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  if (!import.meta.env.DEV) return children
  return (
    <PopmeltProvider navigate={(url) => navigate(url)}>
      {children}
    </PopmeltProvider>
  )
}

function Root() {
  useMountEffect(() => {
    stores.retain()
    return () => stores.dispose()
  })
  return (
    <StoresProvider stores={stores}>
      <AuthRuntime />
      <BrowserRouter>
        <PopmeltRoot>
          <AppView />
        </PopmeltRoot>
      </BrowserRouter>
    </StoresProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
