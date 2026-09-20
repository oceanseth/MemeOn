import { StrictMode } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { authStatusCopy } from '../copy/authStatus'
import { setMaskyOauthState } from '../lib/sessionBus'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { deferred, pathOf, settle } from '../test/runtime'
import { AuthCallbackView } from '../views/AuthCallbackView'

vi.mock('../lib/firebase', () => ({
  firebaseSignIn: vi.fn(),
  firebaseSignOut: vi.fn(),
  onFirebaseUser: vi.fn(() => () => {}),
}))

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

const profile = { sub: 'callback-user', name: 'Callback User', picture: null, coins: 1 }

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  sessionStorage.clear()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('exchanges a Masky code once under StrictMode, stays off the failed title, and navigates once', async () => {
  const code = `callback-once-${crypto.randomUUID()}`
  const state = `state-${crypto.randomUUID()}`
  const exchange = deferred<Response>()
  const callbackInits: RequestInit[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
    const path = pathOf(input)
    if (path === '/api/auth/masky/callback') {
      callbackInits.push(init ?? {})
      return exchange.promise
    }
    throw new Error(`Unexpected request: ${path}`)
  }))
  setMaskyOauthState(state)

  const stores = createStores()
  stores.retain()
  vi.spyOn(stores.auth, 'refresh').mockResolvedValue(undefined)

  await act(() => {
    root.render(
      <StrictMode>
        <StoresProvider stores={stores}>
          <MemoryRouter initialEntries={[`/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`]}>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallbackView />} />
              <Route path="/marketplace" element={<p>Marketplace</p>} />
            </Routes>
            <CurrentRoute />
          </MemoryRouter>
        </StoresProvider>
      </StrictMode>,
    )
  })
  await act(async () => { await settle() })
  await vi.waitFor(() => expect(callbackInits).toHaveLength(1))
  expect(JSON.parse(String(callbackInits[0]?.body))).toMatchObject({ code })
  expect(host.querySelector('[data-slot="auth-status"]')?.getAttribute('data-phase')).toBe('working')
  expect(host.textContent).toContain(authStatusCopy.callback.working.title)
  expect(host.textContent).not.toContain(authStatusCopy.callback.failed.title)

  await act(async () => {
    exchange.resolve(Response.json({
      sessionToken: 'sess-callback',
      maskyAccessToken: 'masky-callback',
      firebaseToken: null,
      profile,
    }))
    await settle()
  })
  await vi.waitFor(() => {
    expect(host.querySelector('[aria-label="Current route"]')?.textContent).toBe('/marketplace')
  })
  expect(host.textContent).toContain('Marketplace')
  expect(host.textContent).not.toContain(authStatusCopy.callback.failed.title)
  expect(host.querySelector('[data-slot="auth-status"]')).toBeNull()
  expect(callbackInits).toHaveLength(1)
  stores.dispose()
})
