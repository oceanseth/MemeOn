import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { meLou } from '../../.storybook/fixtures'
import { setDiscordLinkConsent } from '../lib/sessionBus'
import { authMachine } from '../stores/authMachine'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { useDiscordLinkScreen } from './useDiscordLinkScreen'

vi.mock('../lib/presence', () => ({ watchPresence: vi.fn(() => vi.fn()) }))
vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))
vi.mock('../lib/auth', () => ({
  beginMaskyLogin: vi.fn(async () => {}),
  completeMaskyLogin: vi.fn(async () => {}),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const result = Response.json(body, init)
  result.text = async () => JSON.stringify(body)
  return result
}

let host: HTMLDivElement
let root: Root
let stores: ReturnType<typeof createStores>
const fetchMock = vi.fn<typeof fetch>()
const requests: Array<{ path: string; init?: RequestInit | undefined }> = []

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  requests.length = 0
  fetchMock.mockReset().mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
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
  stores.retain()
  await stores.auth.refresh()
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

function tree(child: ReactNode, path: string, strict: boolean) {
  const routed = (
    <StoresProvider stores={stores}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/discord/link" element={child} />
        </Routes>
      </MemoryRouter>
    </StoresProvider>
  )
  return strict ? <StrictMode>{routed}</StrictMode> : routed
}

async function mountHook(path: string, strict = false) {
  let model!: ReturnType<typeof useDiscordLinkScreen>
  const Probe = observer(function Probe() {
    model = useDiscordLinkScreen()
    return <output>{model.phase}</output>
  })
  await act(() => root.render(tree(<Probe />, path, strict)))
  return {
    current: () => model,
    text: () => host.textContent,
  }
}

function linkRequests(): Array<{ path: string; init?: RequestInit | undefined }> {
  return requests.filter((request) => request.path === '/api/discord/link')
}

function holdLinkPost() {
  const pending = deferred<Response>()
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/discord/link') return pending.promise
    throw new Error(`Unexpected fixture request: ${path}`)
  })
  return pending
}

it('posts /api/discord/link once under StrictMode when consent is already stashed', async () => {
  const pending = holdLinkPost()
  setDiscordLinkConsent('1')
  const probe = await mountHook('/discord/link?token=strict-consent-token', true)
  expect(linkRequests()).toHaveLength(1)
  expect(JSON.parse(String(linkRequests()[0]?.init?.body))).toEqual({ token: 'strict-consent-token' })
  expect(probe.text()).toBe('working')
  await act(async () => {
    pending.resolve(jsonResponse({}))
    await pending.promise
  })
  expect(probe.text()).toBe('done')
  expect(linkRequests()).toHaveLength(1)
})

it('does not POST on StrictMode remount while waiting for consent', async () => {
  const probe = await mountHook('/discord/link?token=strict-confirm-token', true)
  expect(probe.text()).toBe('confirm')
  expect(linkRequests()).toHaveLength(0)
})

it('keeps the first StrictMode lifetime from completing after the committed mount posts', async () => {
  const pending = holdLinkPost()
  setDiscordLinkConsent('1')
  const probe = await mountHook('/discord/link?token=strict-cancel-token', true)
  expect(linkRequests()).toHaveLength(1)
  await act(async () => {
    pending.resolve(jsonResponse({}))
    await pending.promise
  })
  expect(probe.text()).toBe('done')
  expect(linkRequests()).toHaveLength(1)
})
