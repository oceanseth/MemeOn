import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { useAuthRuntime } from './hooks/useAuthRuntime'
import { useMountEffect } from './hooks/useMountEffect'
import { createStores } from './stores/createStores'
import { StoresProvider } from './stores/StoresContext'
import './index.css'

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
