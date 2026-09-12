import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { friendAccepted, giftablePaper, meLou } from '../../.storybook/fixtures'
import type { Me } from '../lib/types'
import { authMachine } from '../stores/authMachine'
import { createStores, type AppStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { FriendsView } from '../views/FriendsView'

vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))
vi.mock('../lib/presence', () => ({ watchPresence: () => () => {} }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function json(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response
}

function details(input: RequestInfo | URL, init?: RequestInit) {
  const value = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url
  return {
    url: new URL(value, window.location.origin),
    method: init?.method ?? 'GET',
    body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
  }
}

async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
    await settle()
  })
}

function button(label: string, parent: ParentNode = host): HTMLButtonElement {
  const found = [...parent.querySelectorAll<HTMLButtonElement>('button')]
    .find((candidate) => candidate.textContent?.includes(label))
  if (!found) throw new Error(`Missing button: ${label}`)
  return found
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
    await settle()
  })
}

async function search(value: string): Promise<void> {
  const input = host.querySelector<HTMLInputElement>('input[placeholder^="Find people"]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
  })
}

interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

interface SocialApiOptions {
  gifts?: Array<ReturnType<typeof deferred<Response>>>
  friendRequests?: Array<ReturnType<typeof deferred<Response>>>
}

function installSocialApi(options: SocialApiOptions = {}) {
  const requests: RecordedRequest[] = []
  const userQueries: string[] = []
  let giftIndex = 0
  let requestIndex = 0
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
    const request = details(input, init)
    requests.push({ method: request.method, path: request.url.pathname, body: request.body })
    if (request.method === 'GET' && request.url.pathname === '/api/friends') {
      return Promise.resolve(json({ friends: [friendAccepted] }))
    }
    if (request.method === 'GET' && request.url.pathname === '/api/binder') {
      return Promise.resolve(json({ memes: [giftablePaper] }))
    }
    if (request.method === 'POST' && request.url.pathname === '/api/gift') {
      const pending = options.gifts?.[giftIndex++]
      if (!pending) throw new Error('Unexpected gift submission')
      return pending.promise
    }
    if (request.method === 'POST' && request.url.pathname === '/api/friends/request') {
      const pending = options.friendRequests?.[requestIndex++]
      if (!pending) throw new Error('Unexpected friend request')
      return pending.promise
    }
    if (request.method === 'GET' && request.url.pathname === '/api/users') {
      const query = request.url.searchParams.get('q') ?? ''
      userQueries.push(query)
      return Promise.resolve(json({
        users: [{ sub: query.toLocaleLowerCase(), name: query, picture: null }],
      }))
    }
    throw new Error(`Unexpected request: ${request.method} ${request.url.pathname}`)
  }))
  return { requests, userQueries }
}

function giftRequests(requests: RecordedRequest[]): RecordedRequest[] {
  return requests.filter((request) => request.method === 'POST' && request.path === '/api/gift')
}

async function openAndPickGift(): Promise<HTMLElement> {
  await click(host.querySelector<HTMLElement>('[aria-label^="Gift shares to"]')!)
  const dialog = host.querySelector<HTMLElement>('[data-slot="dialog"]')!
  await click(button(giftablePaper.title, dialog))
  return dialog
}

// the dialog is a Base UI popup: mounted means open, so presence is the whole state
function giftDialogOpen(): boolean {
  return host.querySelector('[data-slot="dialog"]') !== null
}

let host: HTMLDivElement
let root: Root
let stores: AppStores

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const authActor = createActor(authMachine.provide({
    actors: { loadMe: fromPromise(async (): Promise<Me | null> => meLou) },
    actions: { clearSessionAndFirebase: () => {} },
  }))
  stores = createStores(authActor)
  stores.retain()
  await stores.auth.refresh()
})

afterEach(async () => {
  await act(() => root.unmount())
  stores.auth.logout()
  stores.dispose()
  await Promise.resolve()
  host.remove()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function renderFriends(): Promise<void> {
  await act(async () => {
    root.render(
      <StoresProvider stores={stores}>
        <MemoryRouter initialEntries={['/friends']}>
          <FriendsView />
        </MemoryRouter>
      </StoresProvider>,
    )
    await settle()
  })
  expect(host.textContent).toContain(friendAccepted.name)
}

describe('FriendsView gift lifetime', () => {
  it('locks the dialog down while a gift is in flight, then clears busy on success', async () => {
    const pendingGift = deferred<Response>()
    const api = installSocialApi({ gifts: [pendingGift] })
    await renderFriends()

    let dialog = await openAndPickGift()
    await click(button('Gift 1 of', dialog))
    expect(giftRequests(api.requests)).toEqual([expect.objectContaining({
      body: { memeId: giftablePaper.id, toSub: friendAccepted.sub, shares: 1 },
    })])
    expect(button('Gifting', dialog).disabled).toBe(true)

    // in flight every control says so instead of looking operable, and the dialog stays put
    expect(dialog.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')!.disabled).toBe(true)
    expect(button('Cancel', dialog).disabled).toBe(true)
    expect(button(giftablePaper.title, dialog).disabled).toBe(true)
    await click(button('Cancel', dialog))
    expect(giftDialogOpen()).toBe(true)

    // and the guarded submit still cannot double the POST if the disabled attribute is forced off
    const pendingSubmit = button('Gifting', dialog)
    pendingSubmit.disabled = false
    await click(pendingSubmit)
    expect(giftRequests(api.requests)).toHaveLength(1)

    await act(async () => {
      pendingGift.resolve(json({ ok: true }))
      await settle()
    })
    expect(giftDialogOpen()).toBe(false)
    expect(host.textContent).toContain('Gifted 1 share')

    dialog = await openAndPickGift()
    expect(button('Gift 1 of', dialog).disabled).toBe(false)
  })

  it('clears busy after failure, shows the error, and permits exactly one retry', async () => {
    const firstGift = deferred<Response>()
    const retryGift = deferred<Response>()
    const api = installSocialApi({ gifts: [firstGift, retryGift] })
    await renderFriends()

    const dialog = await openAndPickGift()
    await click(button('Gift 1 of', dialog))
    await act(async () => {
      firstGift.resolve(json({ error: 'gift unavailable' }, 503))
      await settle()
    })
    expect(dialog.querySelector('[data-slot="notice"]')?.textContent).toContain('gift unavailable')
    expect(button('Gift 1 of', dialog).disabled).toBe(false)
    expect(giftRequests(api.requests)).toHaveLength(1)

    await click(button('Gift 1 of', dialog))
    expect(giftRequests(api.requests)).toHaveLength(2)
    expect(button('Gifting', dialog).disabled).toBe(true)
    await act(async () => {
      retryGift.resolve(json({ ok: true }))
      await settle()
    })
    expect(giftDialogOpen()).toBe(false)
  })
})

describe('FriendsView friend-request debounce ownership', () => {
  it('cancels a scheduled Bob search when the visible Alice request succeeds first', async () => {
    const request = deferred<Response>()
    const api = installSocialApi({ friendRequests: [request] })
    await renderFriends()
    await search('Alice')
    await advance(250)
    expect(host.textContent).toContain('Alice')

    await search('Bob')
    await click(button('Add friend'))
    await act(async () => {
      request.resolve(json({ ok: true }))
      await settle()
    })
    await advance(300)

    expect(host.querySelector<HTMLInputElement>('input[placeholder^="Find people"]')?.value).toBe('')
    expect(api.userQueries).toEqual(['Alice'])
    expect(host.textContent).not.toContain('Bob')
    expect([...host.querySelectorAll('button')].some((candidate) => candidate.textContent === 'Add friend')).toBe(false)
  })

  it('preserves a scheduled Bob search when the visible Alice request fails', async () => {
    const request = deferred<Response>()
    const api = installSocialApi({ friendRequests: [request] })
    await renderFriends()
    await search('Alice')
    await advance(250)
    await search('Bob')
    await click(button('Add friend'))
    await act(async () => {
      request.resolve(json({ error: 'request unavailable' }, 503))
      await settle()
    })
    await advance(300)

    expect(host.querySelector<HTMLInputElement>('input[placeholder^="Find people"]')?.value).toBe('Bob')
    expect(api.userQueries).toEqual(['Alice', 'Bob'])
    // the raw API string never reaches the user; the surface names the problem and the recovery
    expect(host.textContent).toContain("Couldn't send that friend request")
    expect(host.querySelector('[data-slot="notice"]')).not.toBeNull()
    expect(host.textContent).toContain('Bob')
    expect(button('Add friend')).toBeTruthy()
  })

  it('cancels scheduled searches on manual clear and true unmount', async () => {
    const api = installSocialApi()
    await renderFriends()
    await search('Alice')
    await search('')
    await advance(300)
    expect(api.userQueries).toEqual([])

    await search('Bob')
    await act(() => root.unmount())
    await advance(300)
    expect(api.userQueries).toEqual([])
    expect(host.textContent).toBe('')
  })
})
