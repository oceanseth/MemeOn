// First import, always: a cascade layer's rank is fixed the first time its name is seen, so the
// order statement in `index.css` has to reach the bundle ahead of every component's `@layer` block.
import './index.css'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { useAuthRuntime } from './hooks/useAuthRuntime'
import { useMountEffect } from './hooks/useMountEffect'
import { createStores } from './stores/createStores'
import { StoresProvider } from './stores/StoresContext'

function AuthRuntime() {
  useAuthRuntime()
  return null
}

function Root() {
  const [stores] = useState(() => createStores())
  useMountEffect(() => {
    stores.retain()
    return () => stores.dispose()
  })
  return (
    <StoresProvider stores={stores}>
      <AuthRuntime />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoresProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
