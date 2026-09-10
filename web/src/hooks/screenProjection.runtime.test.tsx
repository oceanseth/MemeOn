import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { invitePal, meLou, memeplexEmpty, paperMeme } from '../../.storybook/fixtures'
import { TIERS } from '../../../shared/tiers'
import { authMachine } from '../stores/authMachine'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { useAppShellScreen } from './useAppShellScreen'
import { useLandingScreen } from './useLandingScreen'
import { useCreateMemeScreen } from './useCreateMemeScreen'
import { useMarketplaceScreen } from './useMarketplaceScreen'
import { useMemeDetailScreen } from './useMemeDetailScreen'
import { useTradesScreen } from './useTradesScreen'
import { useFriendsScreen } from './useFriendsScreen'
import { useBinderScreen } from './useBinderScreen'
import { useProfileScreen, type ProfileData } from './useProfileScreen'
import { useLeaderboardScreen } from './useLeaderboardScreen'
import { useInviteScreen } from './useInviteScreen'
import { useDiscordPageScreen } from './useDiscordPageScreen'
import { useDiscordLinkScreen } from './useDiscordLinkScreen'
import { useDevelopersScreen } from './useDevelopersScreen'
import { ProfileView } from '../views/ProfileView'
import { AppView } from '../views/AppView'

vi.mock('../lib/presence', () => ({ watchPresence: vi.fn(() => vi.fn()) }))
vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))
vi.mock('../lib/auth', () => ({
  beginMaskyLogin: vi.fn(async () => {}),
  completeMaskyLogin: vi.fn(async () => {}),
}))

const profile: ProfileData = {
  profile: { ...invitePal.inviter },
  created: [paperMeme], binder: [{ ...paperMeme, id: 'held', title: 'held card', shares: 2 }],
  followingByMe: false, friendStatus: null,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const result = Response.json(body, init)
  // These tests control API completion; streamed body scheduling is tested by auth regressions.
  result.text = async () => JSON.stringify(body)
  return result
}

let host: HTMLDivElement
let root: Root
let stores: ReturnType<typeof createStores>
const fetchMock = vi.fn<typeof fetch>()
const requests: Array<{ path: string; init?: RequestInit | undefined }> = []

function response(path: string): unknown {
  if (path === '/api/frames') return { frames: TIERS.map((tier) => ({ key: tier.key, url: `/frames/${tier.key}.png` })) }
  if (path === '/api/alerts') return { alerts: [] }
  if (path === '/api/onboarding') return { steps: [] }
  if (path.startsWith('/api/memes?') || path === '/api/memes' || path === '/api/binder') return { memes: [paperMeme], nextCursor: null }
  if (path === '/api/memes/meme-paper') return { meme: paperMeme, positions: [] }
  if (path.endsWith('/stats')) return { sources: [] }
  if (path.endsWith('/memeplex')) return memeplexEmpty
  if (path === '/api/trades') return { trades: [] }
  if (path === '/api/friends') return { friends: [] }
  if (path.startsWith('/api/users?')) return { users: [] }
  if (path.endsWith('/profile')) return profile
  if (path === '/api/leaderboard') return { leaders: [{ ...meLou, braincells: 42 }] }
  if (path === '/api/invite/user-pal') return invitePal
  if (path === '/api/discord/config') return { configured: true, installUrl: 'https://discord.com/install' }
  if (path === '/api/discord/link') return {}
  if (path === '/api/developers/keys') return { keys: [] }
  throw new Error(`Unexpected fixture request: ${path}`)
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  requests.length = 0
  fetchMock.mockReset().mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    return jsonResponse(response(path))
  })
  vi.stubGlobal('fetch', fetchMock)
  stores = createStores(createActor(authMachine.provide({ actors: { loadMe: fromPromise<typeof meLou | null>(async () => meLou) } })))
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

function tree(child: ReactNode, path = '/test/user-pal/meme-paper?token=projection-token') {
  return <StoresProvider stores={stores}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/test/:sub/:id" element={child} />
  </Routes></MemoryRouter></StoresProvider>
}

async function mountHook<Model>(useModel: () => Model, read: (model: Model) => string) {
  let model!: Model
  const renders: string[] = []
  const Probe = observer(function Probe() {
    model = useModel()
    const value = read(model)
    renders.push(value)
    return <output>{value}</output>
  })
  await act(() => root.render(tree(<Probe />)))
  return { current: () => model, renders, text: () => host.textContent }
}

it('AppShell projects alert-open events', async () => {
  const probe = await mountHook(useAppShellScreen, (m) => `${m.phase}:${m.alertsBell.open}`)
  expect(probe.text()).toBe('loggedIn:false')
  await act(() => probe.current().alertsBell.triggerProps.onClick?.({} as never))
  expect(probe.text()).toBe('loggedIn:true')
})

it('Landing projects async frame results', async () => {
  // every tier keeps a slot through all three states; only a ready slot carries image props
  const probe = await mountHook(useLandingScreen, (m) => `${m.phase}:${Object.values(m.frameImageProps).filter(Boolean).length}`)
  expect(probe.renders).toContain('loading:0')
  expect(probe.text()).toBe(`ready:${TIERS.length}`)
})

it('CreateMeme projects editable draft events', async () => {
  const probe = await mountHook(useCreateMemeScreen, (m) => String(m.titleInputProps.value))
  expect(probe.text()).toBe('')
  await act(() => probe.current().titleInputProps.onChange?.({ currentTarget: { value: 'draft' } } as never))
  expect(probe.text()).toBe('draft')
})

it('Marketplace projects filter events', async () => {
  const probe = await mountHook(useMarketplaceScreen, (m) => m.queryInputProps.value)
  await act(() => probe.current().queryInputProps.onChange({ target: { value: 'cats' } } as never))
  expect(probe.text()).toBe('cats')
})

it('MemeDetail projects async load events', async () => {
  const probe = await mountHook(useMemeDetailScreen, (m) => `${m.phase}:${m.detail?.title ?? ''}`)
  expect(probe.renders).toContain('loading:')
  expect(probe.text()).toBe(`ready:${paperMeme.title}`)
})

it('actual MemeDetailView in the app route observes deferred loading and later dialog events in StrictMode', async () => {
  const detail = deferred<Response>()
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/memes/meme-paper') return detail.promise
    return jsonResponse(response(path))
  })
  await act(() => root.render(<StrictMode><StoresProvider stores={stores}>
    <MemoryRouter initialEntries={['/m/meme-paper']}><AppView /></MemoryRouter>
  </StoresProvider></StrictMode>))
  expect(host.querySelector('main [data-slot="spinner"]')).not.toBeNull()
  expect(host.querySelector('h2')).toBeNull()
  expect(requests.filter((request) => request.path === '/api/memes/meme-paper')).toHaveLength(2)

  await act(async () => {
    detail.resolve(jsonResponse({
      meme: { ...paperMeme, private: true },
      positions: [{ userId: meLou.sub, shares: 100 }],
    }))
    await detail.promise
  })
  expect(host.querySelector('main [data-slot="spinner"]')).toBeNull()
  expect(host.querySelector('h2')?.textContent).toContain(paperMeme.title)
  expect(host.textContent).toContain('you hold 100/100')
  await act(() => button('Delete forever').click())
  // the confirmations are Base UI popups: mounted means open, so presence is the whole state
  expect(host.querySelector('[role="alertdialog"]')).not.toBeNull()
  await act(() => button('Cancel').click())
  expect(host.querySelector('[role="alertdialog"]')).toBeNull()
  expect(requests.every((request) => !request.init?.method || request.init.method === 'GET')).toBe(true)
})

it('Trades projects composer-open events', async () => {
  const probe = await mountHook(useTradesScreen, (m) => `${m.phase}:${!!m.compose}`)
  await act(() => probe.current().newTradeButtonProps.onClick())
  expect(probe.text()).toBe('composing:true')
})

it('Friends projects search input events', async () => {
  const probe = await mountHook(useFriendsScreen, (m) => String(m.searchInputProps.value))
  await act(() => probe.current().searchInputProps.onChange?.({ target: { value: 'pal' } } as never))
  expect(probe.text()).toBe('pal')
})

it('Binder projects private-filter events', async () => {
  const probe = await mountHook(useBinderScreen, (m) => String(m.privateToggleProps.checked))
  await act(() => probe.current().privateToggleProps.onChange?.({ target: { checked: true } } as never))
  expect(probe.text()).toBe('true')
})

it('Profile projects loaded data and tab events', async () => {
  const probe = await mountHook(useProfileScreen, (m) => `${m.profile?.name ?? ''}:${m.binderTabButtonProps['aria-pressed']}`)
  expect(probe.renders).toContain(':false')
  expect(probe.text()).toBe('pal:false')
  await act(() => probe.current().binderTabButtonProps.onClick?.({} as never))
  expect(probe.text()).toBe('pal:true')
})

it('Leaderboard projects async row results', async () => {
  const probe = await mountHook(useLeaderboardScreen, (m) => `${m.phase}:${m.leaders[0]?.name ?? ''}`)
  expect(probe.renders).toContain('loading:')
  expect(probe.text()).toBe('ready:lou')
})

it('Invite projects async inviter results', async () => {
  const probe = await mountHook(useInviteScreen, (m) => `${m.phase}:${m.inviter?.name ?? ''}`)
  expect(probe.renders).toContain('loading:')
  expect(probe.text()).toBe('ready:pal')
})

it('DiscordPage projects async configuration results', async () => {
  const probe = await mountHook(useDiscordPageScreen, (m) => `${m.phase}:${m.showInstall}`)
  expect(probe.renders).toContain('loading:false')
  expect(probe.text()).toBe('ready:true')
})

it('DiscordLink waits for consent, then projects completion of a pending link exactly once', async () => {
  const pending = deferred<Response>()
  fetchMock.mockImplementation(async (input, init) => {
    requests.push({ path: String(input), init })
    return pending.promise
  })
  const probe = await mountHook(useDiscordLinkScreen, (m) => m.phase)
  expect(probe.text()).toBe('confirm')
  expect(requests).toHaveLength(0)
  await act(() => probe.current().onConfirm())
  expect(probe.text()).toBe('working')
  await act(async () => { pending.resolve(jsonResponse({})); await pending.promise })
  expect(probe.text()).toBe('done')
  expect(requests).toHaveLength(1)
  expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({ token: 'projection-token' })
})

it('Developers projects API-key label events', async () => {
  const probe = await mountHook(useDevelopersScreen, (m) => String(m.labelInputProps.value))
  await act(() => probe.current().labelInputProps.onChange?.({ currentTarget: { value: 'bot key' } } as never))
  expect(probe.text()).toBe('bot key')
})

it('Developers surfaces a failed key-list load as a retryable error, never as an empty account', async () => {
  fetchMock.mockRejectedValue(new Error('offline'))
  const probe = await mountHook(useDevelopersScreen, (m) => `${m.phase}:${m.showEmpty}:${m.showLoadError}`)
  expect(probe.text()).toBe('error:false:true')
})

it('Binder surfaces a failed initial load as a retryable error, never as an empty binder', async () => {
  fetchMock.mockRejectedValue(new Error('offline'))
  const probe = await mountHook(useBinderScreen, (m) => `${m.phase}:${m.showEmpty}:${m.showError}`)
  expect(probe.text()).toBe('error:false:true')
})

it.each([
  // Friends is the exception: a failed load reaches `error` with a Retry, never a false "no friends yet"
  ['Friends', () => { const m = useFriendsScreen(); return `${m.phase}:${m.showError}:${m.showEmpty}` }, 'error:true:false'],
  // Leaderboard: an unreachable board is an error with a Retry, never a false "throne is empty"
  ['Leaderboard', () => { const m = useLeaderboardScreen(); return `${m.phase}:${m.showError}:${m.showEmpty}` }, 'error:true:false'],
  ['MemeDetail', () => { const m = useMemeDetailScreen(); return `${m.phase}:${m.showNotFound}` }, 'empty:true'],
  // DiscordPage: an unreachable config is its own state — a network failure must never read as "registering"
  ['DiscordPage', () => { const m = useDiscordPageScreen(); return `${m.phase}:${m.showPending}:${m.showError}` }, 'errored:false:true'],
] as const)('%s retains its existing initial-request failure presentation', async (_name, useModel, expected) => {
  fetchMock.mockRejectedValue(new Error('offline'))
  const probe = await mountHook(useModel, (value) => value)
  expect(probe.text()).toBe(expected)
})

function button(label: string): HTMLButtonElement {
  const found = Array.from(host.querySelectorAll('button')).find((element) => element.textContent?.includes(label))
  expect(found, `button containing ${label}`).toBeDefined()
  return found!
}

it('ProfileView retains the selected tab and mounted cards while follow and friend actions reload', async () => {
  const reload = deferred<Response>()
  let latest = profile
  let holdReload = false
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path.endsWith('/follow')) { latest = { ...latest, followingByMe: true }; holdReload = true; return jsonResponse({}) }
    if (path === '/api/friends/request') { latest = { ...latest, friendStatus: 'outgoing' }; return jsonResponse({}) }
    if (path.endsWith('/profile')) return holdReload ? reload.promise : jsonResponse(latest)
    throw new Error(`Unexpected relationship request: ${path}`)
  })
  await act(() => root.render(tree(<ProfileView initialTab="binder" />)))
  expect(button('Binder').getAttribute('aria-pressed')).toBe('true')
  expect(host.textContent).toContain('held card')
  const binderTab = button('Binder')
  await act(async () => { button('Follow').click() })
  expect(button('Binder')).toBe(binderTab)
  expect(host.textContent).toContain('held card')
  await act(async () => { holdReload = false; reload.resolve(jsonResponse(latest)); await reload.promise })
  expect(button('Following').getAttribute('aria-pressed')).toBe('true')
  await act(async () => { button('Add friend').click() })
  // a settled request is state, not a control: the button gives way to a chip
  expect(host.querySelector('.badge.state')?.textContent).toContain('Request sent')
  expect(Array.from(host.querySelectorAll('button')).some((b) => b.textContent?.includes('friend'))).toBe(false)
  expect(button('Binder')).toBe(binderTab)
  expect(button('Binder').getAttribute('aria-pressed')).toBe('true')
  expect(requests.filter((r) => r.path.endsWith('/profile'))).toHaveLength(3)
  expect(JSON.parse(String(requests.find((r) => r.path === '/api/friends/request')?.init?.body))).toEqual({ userId: 'user-pal' })
})

it('ProfileView reloads after accepting an incoming friend and preserves reload errors', async () => {
  let latest = { ...profile, friendStatus: 'incoming' as ProfileData['friendStatus'] }
  let failReload = false
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input)
    requests.push({ path, init })
    if (path === '/api/friends/respond') { latest = { ...latest, friendStatus: 'accepted' }; return jsonResponse({}) }
    if (path.endsWith('/follow')) { failReload = true; return jsonResponse({}) }
    if (path.endsWith('/profile')) return failReload ? jsonResponse({}, { status: 503 }) : jsonResponse(latest)
    throw new Error(`Unexpected relationship request: ${path}`)
  })
  await act(() => root.render(tree(<ProfileView />)))
  await act(async () => { button('Accept request').click() })
  expect(host.querySelector('.badge.state')?.textContent).toContain('Friends')
  expect(JSON.parse(String(requests.find((r) => r.path === '/api/friends/respond')?.init?.body))).toEqual({ userId: 'user-pal', accept: true })
  await act(async () => { button('Follow').click() })
  expect(host.textContent).toContain("Couldn't load this profile.")
})

it('ProfileView shows initial load failure', async () => {
  fetchMock.mockRejectedValue(new Error('offline'))
  await act(() => root.render(tree(<ProfileView />)))
  // the failure is named and recoverable; no profile identity or actions are invented
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("Couldn't load this profile.")
  expect(button('Retry').disabled).toBe(false)
  expect(host.querySelector('[aria-label="Profile actions"]')).toBeNull()
})

it('actual profile route keys reject late results and reset the selected tab for the next profile', async () => {
  const oldProfile = deferred<Response>()
  const nextProfile = deferred<Response>()
  let oldLoads = 0
  fetchMock.mockImplementation(async (input) => {
    const path = String(input)
    if (path === '/api/users/old/profile') {
      oldLoads += 1
      return oldLoads === 1
        ? jsonResponse({ ...profile, profile: { ...profile.profile, sub: 'old', name: 'Old profile' } })
        : oldProfile.promise
    }
    if (path === '/api/users/old/follow') return jsonResponse({})
    if (path === '/api/users/next/profile') return nextProfile.promise
    return jsonResponse(response(path))
  })
  let navigate!: NavigateFunction
  function Navigation() { navigate = useNavigate(); return <AppView /> }
  await act(() => root.render(<StoresProvider stores={stores}><MemoryRouter initialEntries={['/u/old']}>
    <Navigation />
  </MemoryRouter></StoresProvider>))
  await act(() => button('Binder').click())
  expect(button('Binder').getAttribute('aria-pressed')).toBe('true')
  await act(async () => { button('Follow').click() })
  expect(oldLoads).toBe(2)
  await act(() => navigate('/u/next'))
  await act(async () => {
    nextProfile.resolve(jsonResponse({ ...profile, profile: { ...profile.profile, name: 'Next profile' } }))
    await nextProfile.promise
  })
  expect(host.querySelector('h1')?.textContent).toBe('Next profile')
  expect(button('Created').getAttribute('aria-pressed')).toBe('true')
  const tab = button('Created')
  await act(async () => {
    oldProfile.resolve(jsonResponse({ ...profile, profile: { ...profile.profile, name: 'Old profile' } }))
    await oldProfile.promise
  })
  expect(host.querySelector('h1')?.textContent).toBe('Next profile')
  expect(button('Created')).toBe(tab)
})
