import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { meLou } from '../../.storybook/fixtures'
import { setDiscordLinkConsent } from '../lib/sessionBus'
import { authMachine } from '../stores/authMachine'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { deferred, jsonResponse } from '../test/runtime'
import { useDiscordLinkScreen } from './useDiscordLinkScreen'

vi.mock('../lib/presence', () => ({ watchPresence: vi.fn(() => vi.fn()) }))
vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))
vi.mock('../lib/auth', () => ({
  beginMaskyLogin: vi.fn(async () => {}),
  completeMaskyLogin: vi.fn(async () => {}),
}))

let host: HTMLDivElement
let root: Root
let stores: ReturnType<typeof createStores>
const fetchMock = vi.fn<typeof fetch>()
const requests: Array<{ path: string; init?: RequestInit | undefined }> = []

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  requests.length = 0
  fetchMock.mockReset().mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/discord/link') return jsonResponse({})
    throw new Error(`Unexpected fixture request: ${path}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  stores = createStores(
    createActor(
      authMachine.provide({
        actors: { loadMe: fromPromise<typeof meLou | null>(async () => meLou) },
      }),
    ),
  )
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(() => root.unmount())
  stores.dispose()
  host.remove()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

function Probe() {
  const model = useDiscordLinkScreen()
  return (
    <output>
      {model.phase}
      {model.showConfirm ? <button type="button" onClick={model.onConfirm}>confirm</button> : null}
      {model.canRetry ? <button type="button" onClick={model.onRetry}>retry</button> : null}
    </output>
  )
}

function tree(child: ReactNode, path: string, strict: boolean) {
  const routes = (
    <StoresProvider stores={stores}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/discord/link" element={child} />
        </Routes>
      </MemoryRouter>
    </StoresProvider>
  )
  return strict ? <StrictMode>{routes}</StrictMode> : routes
}

async function signedIn(): Promise<void> {
  stores.retain()
  await stores.auth.refresh()
}

it('StrictMode double-mount POSTs /api/discord/link once when consent is already in the bus', async () => {
  const pending = deferred<Response>()
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/discord/link') return pending.promise
    throw new Error(`Unexpected fixture request: ${path}`)
  })
  await signedIn()
  setDiscordLinkConsent('1')
  await act(() => root.render(tree(<Probe />, '/discord/link?token=once-token', true)))
  expect(requests.filter((request) => request.path === '/api/discord/link')).toHaveLength(1)
  expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({ token: 'once-token' })
  expect(host.textContent).toContain('working')
  await act(async () => {
    pending.resolve(jsonResponse({}))
    await pending.promise
  })
  expect(host.textContent).toContain('done')
  expect(requests.filter((request) => request.path === '/api/discord/link')).toHaveLength(1)
})

it('retries an unreachable POST with a second /api/discord/link', async () => {
  let linkCalls = 0
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path !== '/api/discord/link') throw new Error(`Unexpected fixture request: ${path}`)
    linkCalls += 1
    if (linkCalls === 1) return jsonResponse({ error: 'boom' }, { status: 500 })
    return jsonResponse({})
  })
  await signedIn()
  await act(() => root.render(tree(<Probe />, '/discord/link?token=retry-token', false)))
  expect(host.textContent).toContain('confirm')
  await act(() => host.querySelector('button')?.click())
  expect(host.textContent).toContain('error')
  await act(() => host.querySelector('button')?.click())
  expect(host.textContent).toContain('done')
  expect(requests.filter((request) => request.path === '/api/discord/link')).toHaveLength(2)
})

it('keeps the latest query token until auth settles, then freezes it after POST', async () => {
  const me = deferred<typeof meLou | null>()
  stores.dispose()
  stores = createStores(
    createActor(
      authMachine.provide({
        actors: { loadMe: fromPromise<typeof meLou | null>(async () => me.promise) },
      }),
    ),
  )
  stores.retain()
  const refresh = stores.auth.refresh()
  const pending = deferred<Response>()
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/discord/link') return pending.promise
    throw new Error(`Unexpected fixture request: ${path}`)
  })

  function Harness() {
    return (
      <>
        <nav>
          <Link to="/discord/link?token=token-a">Token A</Link>
          <Link to="/discord/link?token=token-b">Token B</Link>
          <Link to="/discord/link?token=token-c">Token C</Link>
        </nav>
        <Routes>
          <Route path="/discord/link" element={<Probe />} />
        </Routes>
      </>
    )
  }

  await act(() =>
    root.render(
      <StoresProvider stores={stores}>
        <MemoryRouter initialEntries={['/discord/link?token=token-a']}>
          <Harness />
        </MemoryRouter>
      </StoresProvider>,
    ),
  )
  await act(() => {
    host.querySelector<HTMLAnchorElement>('a[href="/discord/link?token=token-b"]')?.click()
  })
  me.resolve(meLou)
  await act(async () => {
    await refresh
  })
  expect(host.textContent).toContain('confirm')
  await act(() => host.querySelector('button')?.click())
  await act(async () => {
    pending.resolve(jsonResponse({}))
    await pending.promise
  })
  expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({ token: 'token-b' })
  await act(() => {
    host.querySelector<HTMLAnchorElement>('a[href="/discord/link?token=token-c"]')?.click()
  })
  expect(requests.filter((request) => request.path === '/api/discord/link')).toHaveLength(1)
})
