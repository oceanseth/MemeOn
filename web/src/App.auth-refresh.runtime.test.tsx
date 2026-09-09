import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from './App'
import { setMaskyAccessToken, setSessionToken } from './lib/api'
import type { Me } from './lib/types'
import { createStores } from './stores/createStores'
import { StoresProvider } from './stores/StoresContext'

vi.mock('./lib/firebase', () => ({
  firebaseSignIn: vi.fn(async () => {}),
  firebaseSignOut: vi.fn(),
  rtdb: {},
}))

const beforeClaim: Me = {
  sub: 'legacy-refresh-user', name: 'Legacy Refresh User', picture: null, coins: 42,
  portfolioValue: 0, collectionSize: 0, unreadAlerts: 1, onboarding: { pack: 'todo' },
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  setSessionToken('legacy-refresh-session')
  setMaskyAccessToken('legacy-refresh-masky')
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps the legacy mint draft mounted while a post-pack refresh replaces an older account read', async () => {
  let coins = beforeClaim.coins
  let unread = true
  const held: Array<{ snapshot: Me; resolve: (response: Response) => void; signal: AbortSignal | null }> = []
  let holdAccountReads = false
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString(), 'http://localhost')
    if (url.pathname === '/api/me') {
      const snapshot = { ...beforeClaim, coins, unreadAlerts: unread ? 1 : 0 }
      if (!holdAccountReads) return Response.json(snapshot)
      return await new Promise<Response>((resolve) => held.push({ snapshot, resolve, signal: init?.signal ?? null }))
    }
    if (url.pathname === '/api/alerts') return Response.json({ alerts: unread ? [{ id: 'alert-1', type: 'sale', message: 'Sale', memeId: null, read: false, createdAt: '2026-09-09T00:00:00.000Z' }] : [] })
    if (url.pathname === '/api/alerts/read') {
      unread = false
      return Response.json({})
    }
    if (url.pathname === '/api/onboarding') return Response.json({ steps: [{ key: 'pack', title: 'Starter pack', reward: 10, hint: 'Open it', done: false }] })
    if (url.pathname === '/api/onboarding/claim-pack') {
      coins = 52
      return Response.json({ memes: [], reward: 10 })
    }
    return Response.json({ error: `Unhandled ${url.pathname}` }, { status: 404 })
  }))

  const stores = createStores()
  stores.retain()
  await stores.auth.refresh()
  await act(async () => {
    root.render(<StoresProvider stores={stores}><MemoryRouter initialEntries={['/binder/new']}><App /></MemoryRouter></StoresProvider>)
    await nextTick()
    await nextTick()
  })

  // selected by its stable id, so placeholder copy can be reworded without breaking the regression
  // the mint route is code-split, so its lazy chunk lands a few ticks after the shell
  for (let attempt = 0; attempt < 100 && !host.querySelector('input#create-title'); attempt += 1) {
    await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  }
  // selected by its stable id, so placeholder copy can be reworded without breaking the regression
  const title = host.querySelector<HTMLInputElement>('input#create-title')!
  const prompt = host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!
  expect(title).toBeTruthy()
  title.value = 'Keep my draft'
  prompt.value = 'Draft prompt survives account refresh'
  await act(async () => {
    title.dispatchEvent(new Event('input', { bubbles: true }))
    prompt.dispatchEvent(new Event('input', { bubbles: true }))
  })

  holdAccountReads = true
  await act(async () => {
    host.querySelector<HTMLButtonElement>('button[aria-label^="Alerts"]')!.click()
    await nextTick()
  })
  expect(held).toHaveLength(1)

  await act(async () => {
    [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Starter pack'))!.click()
    await nextTick()
    await nextTick()
  })
  expect(held).toHaveLength(2)
  expect(held[0]!.signal?.aborted).toBe(true)
  expect(title.isConnected).toBe(true)
  expect(host.querySelector<HTMLInputElement>('input#create-title')).toBe(title)
  expect(title.value).toBe('Keep my draft')
  expect(prompt.value).toBe('Draft prompt survives account refresh')

  await act(async () => {
    held[1]!.resolve(Response.json(held[1]!.snapshot))
    await nextTick()
  })
  expect(host.querySelector('.coins')?.textContent).toContain('52')
  expect(host.querySelector<HTMLInputElement>('input#create-title')).toBe(title)
  expect(title.value).toBe('Keep my draft')
  expect(prompt.value).toBe('Draft prompt survives account refresh')
  stores.dispose()
})
