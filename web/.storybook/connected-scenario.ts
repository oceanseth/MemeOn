import { createActor } from 'xstate'
import {
  developerKeys,
  discordInstallUrl,
  friendAccepted,
  giftableSilver,
  giphyCat,
  giphyCategories,
  giphyDog,
  inviteLou,
  invitePal,
  leaderboardRows,
  listedHolo,
  marketplacePage,
  meLou,
  memeplexFamily,
  paperMeme,
  proposedTrade,
  questStepsFresh,
  tierFrames,
  unreadFriend,
  unreadSale,
} from './fixtures'
import { clearSession, setMaskyAccessToken, setSessionToken } from '../src/lib/api'
import type { FriendEntry, Me, Meme, Trade } from '../src/lib/types'
import type { ProfileData } from '../src/stores/profileMachine'
import { authMachine } from '../src/stores/authMachine'
import { createStores } from '../src/stores/createStores'
import { UnexpectedRequestLedger } from './request-accounting'

export interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

export interface ScenarioResponse {
  status?: number
  body?: unknown
  delay?: Promise<void>
}

export type ScenarioOverride = (
  request: RecordedRequest,
  scenario: ConnectedScenario,
) => ScenarioResponse | Response | Promise<ScenarioResponse | Response>

export interface ConnectedScenarioOptions {
  authenticated?: boolean
  user?: Me
  failures?: Record<string, { status?: number; error: string }>
  overrides?: Record<string, ScenarioOverride>
  discordConfigured?: boolean
  empty?: boolean
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function incomingFriend(): FriendEntry {
  return {
    ...clone(friendAccepted),
    sub: 'user-incoming',
    name: 'incoming pal',
    status: 'incoming',
  }
}

function outgoingFriend(): FriendEntry {
  return {
    ...clone(friendAccepted),
    sub: 'user-outgoing',
    name: 'outgoing pal',
    status: 'outgoing',
  }
}

function profileFor(sub: string, name: string): ProfileData {
  return {
    profile: {
      sub,
      name,
      picture: null,
      followers: 4,
      collectionSize: 2,
      portfolioValue: 90,
    },
    created: [{ ...clone(paperMeme), creatorId: sub, creatorName: name }],
    binder: [{ ...clone(giftableSilver), ownerId: sub, ownerName: name, shares: 4 }],
    followingByMe: false,
    friendStatus: null,
  }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status })
}

function requestKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`
}

export class ConnectedScenario {
  readonly id: string
  readonly requests: RecordedRequest[] = []
  private readonly unexpectedLedger = new UnexpectedRequestLedger()
  readonly copied: string[] = []
  readonly shared: ShareData[] = []
  readonly authorizationNavigations: string[] = []
  readonly deepLinkForwards: string[] = []
  readonly checkpoints: string[] = []
  readonly presenceSubscriptions: string[] = []
  readonly intersectionObservers: Array<(entries: IntersectionObserverEntry[]) => void> = []
  readonly options: ConnectedScenarioOptions
  readonly stores

  user: Me | null
  alerts = clone([unreadSale, unreadFriend])
  questSteps = clone(questStepsFresh)
  memes: Meme[] = clone(marketplacePage.map((meme) => ({ ...meme, myShares: meme.id === listedHolo.id ? 100 : 8 })))
  trades = clone([proposedTrade])
  friends = clone([friendAccepted, incomingFriend(), outgoingFriend()])
  keys = clone(developerKeys)
  profiles = new Map<string, ProfileData>([
    ['user-pal', profileFor('user-pal', 'pal')],
    ['user-lou', profileFor('user-lou', 'lou')],
    ['user-a', profileFor('user-a', 'first title')],
    ['user-b', profileFor('user-b', 'second title')],
  ])
  inviteData = new Map([
    ['user-pal', clone(invitePal)],
    ['user-lou', clone(inviteLou)],
    ['inviter-a', { ...clone(invitePal), inviter: { ...clone(invitePal.inviter), sub: 'inviter-a', name: 'Client A' } }],
    ['inviter-b', { ...clone(invitePal), inviter: { ...clone(invitePal.inviter), sub: 'inviter-b', name: 'Client B' } }],
  ])
  discordConfigured: boolean
  freshKey = 'mo_live_story_secret'
  generatedImage = 'https://media.example.test/generated.png'
  uploadedImage = 'https://media.example.test/uploaded.png'
  mintedMeme = { ...clone(paperMeme), id: 'meme-minted', title: 'story mint' }
  online = new Set<string>([friendAccepted.sub])
  private releases = new Map<string, () => void>()
  private waits = new Map<string, Promise<void>>()
  private released = new Set<string>()

  constructor(id: string, options: ConnectedScenarioOptions = {}) {
    this.id = id
    this.options = options
    this.user = options.authenticated === false ? null : clone(options.user ?? meLou)
    this.discordConfigured = options.discordConfigured ?? true
    if (options.empty) {
      this.alerts = []
      this.memes = []
      this.trades = []
      this.friends = []
      this.keys = []
    }
    this.stores = createStores(createActor(authMachine.provide({
      actions: { clearSessionAndFirebase: clearSession },
    })))
  }

  get unexpected(): readonly RecordedRequest[] {
    return this.unexpectedLedger.requests as RecordedRequest[]
  }

  assertNoUnexpectedRequests(): void {
    this.unexpectedLedger.assertEmpty()
  }

  async start(): Promise<void> {
    this.stores.retain()
    clearSession()
    sessionStorage.clear()
    if (this.user) {
      setSessionToken(`story-session-${this.id}`)
      setMaskyAccessToken(`story-masky-${this.id}`)
    }
    await this.stores.auth.refresh()
  }

  dispose(): void {
    this.stores.auth.logout()
    this.stores.dispose()
    clearSession()
    sessionStorage.clear()
  }

  waitForRelease(name: string): Promise<void> {
    if (this.released.has(name)) return Promise.resolve()
    const existing = this.waits.get(name)
    if (existing) return existing
    const wait = new Promise<void>((resolve) => this.releases.set(name, resolve))
    this.waits.set(name, wait)
    return wait
  }

  release(name: string): void {
    this.released.add(name)
    const release = this.releases.get(name)
    if (release) release()
    this.releases.delete(name)
    this.waits.delete(name)
  }

  intersect(): void {
    for (const callback of this.intersectionObservers) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry])
    }
  }

  private async parsed(request: Request): Promise<RecordedRequest> {
    const url = new URL(request.url)
    let body: unknown = null
    if (!['GET', 'HEAD'].includes(request.method)) {
      const text = await request.clone().text()
      if (text) {
        try { body = JSON.parse(text) } catch { body = text }
      }
    }
    return { method: request.method, path: `${url.pathname}${url.search}`, body }
  }

  async handle(request: Request): Promise<Response> {
    const recorded = await this.parsed(request)
    this.requests.push(recorded)
    const url = new URL(request.url)
    const exactKey = requestKey(recorded.method, recorded.path)
    const pathnameKey = requestKey(recorded.method, url.pathname)
    const override = this.options.overrides?.[exactKey] ?? this.options.overrides?.[pathnameKey]
    if (override) {
      const result = await override(recorded, this)
      if (result instanceof Response) return result
      if (result.delay) await result.delay
      return json(result.body ?? {}, result.status ?? 200)
    }
    const failure = this.options.failures?.[exactKey] ?? this.options.failures?.[pathnameKey]
    if (failure) return json({ error: failure.error }, failure.status ?? 500)
    return this.defaultResponse(recorded, url)
  }

  private defaultResponse(request: RecordedRequest, url: URL): Response {
    const { method, body } = request
    const path = url.pathname
    if (method === 'GET' && path === '/api/me') {
      return this.user ? json(clone(this.user)) : json({ error: 'unauthorized' }, 401)
    }
    if (method === 'GET' && path === '/api/auth/masky/config') {
      return json({
        authorizeUrl: 'https://masky.example.test/authorize',
        clientId: 'memeon-storybook',
        scopes: 'openid profile',
      })
    }
    if (method === 'GET' && path === '/api/frames') {
      return json({ frames: Object.entries(tierFrames).map(([key, frameUrl]) => ({ key, url: frameUrl })) })
    }
    if (method === 'GET' && path === '/api/alerts') return json({ alerts: clone(this.alerts) })
    if (method === 'POST' && path === '/api/alerts/read') {
      const ids = (body as { ids?: string[] } | null)?.ids ?? []
      this.alerts = this.alerts.map((alert) => ids.includes(alert.id) ? { ...alert, read: true } : alert)
      return json({})
    }
    if (method === 'GET' && path === '/api/onboarding') return json({ steps: clone(this.questSteps) })
    if (method === 'POST' && path === '/api/onboarding/claim-pack') {
      this.questSteps = this.questSteps.map((step) => step.key === 'pack' ? { ...step, done: true } : step)
      return json({ memes: [clone(paperMeme)], reward: 20 })
    }
    if (method === 'GET' && path === '/api/binder') return json({ memes: clone(this.memes) })
    if (method === 'GET' && path === '/api/memes') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      const type = url.searchParams.get('type')
      const tier = url.searchParams.get('tier')
      const listed = url.searchParams.get('listed') === 'true'
      let memes = this.memes.filter((meme) => !q || meme.title.toLowerCase().includes(q))
      if (type) memes = memes.filter((meme) => meme.mediaType === type)
      if (tier) memes = memes.filter((meme) => meme.tierKey === tier)
      if (listed) memes = memes.filter((meme) => !!meme.listing)
      const cursor = url.searchParams.get('cursor')
      return json({ memes: clone(cursor ? [this.mintedMeme] : memes), nextCursor: cursor ? null : null })
    }
    if (method === 'POST' && path === '/api/memes') {
      this.mintedMeme = { ...this.mintedMeme, ...(body as Partial<Meme>) }
      this.memes.push(clone(this.mintedMeme))
      return json({ meme: clone(this.mintedMeme) })
    }
    const detailMatch = path.match(/^\/api\/memes\/([^/]+)$/)
    if (detailMatch && method === 'GET') {
      const id = decodeURIComponent(detailMatch[1]!)
      const meme = this.memes.find((candidate) => candidate.id === id) ?? (id === this.mintedMeme.id ? this.mintedMeme : null)
      return meme
        ? json({ meme: clone(meme), positions: [{ userId: this.user?.sub ?? 'user-pal', shares: meme.id === listedHolo.id ? 100 : 8 }] })
        : json({ error: 'not found' }, 404)
    }
    if (method === 'GET' && /^\/api\/memes\/[^/]+\/stats$/.test(path)) {
      return json({ sources: [{ source: 'group chat', views: 12, url: 'https://example.test/source' }] })
    }
    if (method === 'GET' && /^\/api\/memes\/[^/]+\/memeplex$/.test(path)) return json(clone(memeplexFamily))
    if (method === 'POST' && /^\/api\/memes\/[^/]+\/memeplex$/.test(path)) return json({})
    const mutationMatch = path.match(/^\/api\/memes\/([^/]+)\/(buy|list|unlist|visibility|claim)$/)
    if (mutationMatch && method === 'POST') {
      const meme = this.memes.find((candidate) => candidate.id === decodeURIComponent(mutationMatch[1]!))
      if (meme && mutationMatch[2] === 'list') meme.listing = { sellerId: this.user?.sub ?? '', shares: Number((body as { shares: number }).shares), pricePerShare: Number((body as { pricePerShare: number }).pricePerShare) }
      if (meme && mutationMatch[2] === 'unlist') meme.listing = null
      if (meme && mutationMatch[2] === 'visibility') meme.private = Boolean((body as { private: boolean }).private)
      return json({})
    }
    if (detailMatch && method === 'DELETE') {
      this.memes = this.memes.filter((meme) => meme.id !== decodeURIComponent(detailMatch[1]!))
      return json({})
    }
    if (method === 'GET' && path === '/api/trades') return json({ trades: clone(this.trades) })
    if (method === 'POST' && path === '/api/trades') {
      this.trades.push({ ...clone(proposedTrade), id: `trade-${this.trades.length + 1}`, ...(body as Partial<Trade>) })
      return json({})
    }
    const respondMatch = path.match(/^\/api\/trades\/([^/]+)\/respond$/)
    if (respondMatch && method === 'POST') {
      const trade = this.trades.find((candidate) => candidate.id === respondMatch[1])
      if (trade) trade.status = (body as { action: 'accept' | 'decline' }).action === 'accept' ? 'accepted' : 'declined'
      return json({})
    }
    if (method === 'GET' && path === '/api/friends') return json({ friends: clone(this.friends) })
    if (method === 'POST' && path === '/api/friends/request') {
      const userId = String((body as { userId: string }).userId)
      this.friends.push({ ...clone(friendAccepted), sub: userId, name: userId, status: 'outgoing' })
      const profile = this.profiles.get(userId)
      if (profile) profile.friendStatus = 'outgoing'
      return json({})
    }
    if (method === 'POST' && path === '/api/friends/respond') {
      const response = body as { userId: string; accept: boolean }
      this.friends = response.accept
        ? this.friends.map((friend) => friend.sub === response.userId ? { ...friend, status: 'accepted' } : friend)
        : this.friends.filter((friend) => friend.sub !== response.userId)
      const profile = this.profiles.get(response.userId)
      if (profile) profile.friendStatus = response.accept ? 'accepted' : null
      return json({})
    }
    if (method === 'POST' && path === '/api/friends/remove') {
      const userId = String((body as { userId: string }).userId)
      this.friends = this.friends.filter((friend) => friend.sub !== userId)
      return json({})
    }
    if (method === 'POST' && path === '/api/gift') return json({})
    if (method === 'GET' && path === '/api/users') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      const users = [...this.profiles.values()].map(({ profile }) => profile).filter((profile) => !q || profile.name.toLowerCase().includes(q))
      return json({ users: clone(users) })
    }
    const profileMatch = path.match(/^\/api\/users\/([^/]+)\/profile$/)
    if (profileMatch && method === 'GET') {
      const profile = this.profiles.get(decodeURIComponent(profileMatch[1]!))
      return profile ? json(clone(profile)) : json({ error: 'not found' }, 404)
    }
    const followMatch = path.match(/^\/api\/users\/([^/]+)\/(follow|unfollow)$/)
    if (followMatch && method === 'POST') {
      const profile = this.profiles.get(decodeURIComponent(followMatch[1]!))
      if (profile) profile.followingByMe = followMatch[2] === 'follow'
      return json({})
    }
    if (method === 'GET' && path === '/api/leaderboard') {
      return json({ leaders: clone(leaderboardRows) })
    }
    const inviteMatch = path.match(/^\/api\/invite\/([^/]+)$/)
    if (inviteMatch && method === 'GET') {
      const invite = this.inviteData.get(decodeURIComponent(inviteMatch[1]!))
      return invite ? json(clone(invite)) : json({ error: 'invalid invite' }, 404)
    }
    if (method === 'POST' && path === '/api/invites/accept') return json({})
    if (method === 'GET' && path === '/api/discord/config') return json({ configured: this.discordConfigured, installUrl: this.discordConfigured ? discordInstallUrl : null })
    if (method === 'POST' && path === '/api/discord/link') return json({})
    if (method === 'GET' && path === '/api/developers/keys') return json({ keys: clone(this.keys) })
    if (method === 'POST' && path === '/api/developers/keys') {
      const label = String((body as { label?: string }).label ?? 'my key')
      this.keys.push({ prefix: 'mo_live_story', label, createdAt: '2026-09-08T00:00:00.000Z' })
      return json({ key: this.freshKey })
    }
    const keyMatch = path.match(/^\/api\/developers\/keys\/(.+)$/)
    if (keyMatch && method === 'DELETE') {
      this.keys = this.keys.filter((key) => key.prefix !== decodeURIComponent(keyMatch[1]!))
      return json({})
    }
    if (method === 'GET' && path === '/api/giphy/categories') return json({ categories: clone(giphyCategories) })
    if (method === 'GET' && path === '/api/giphy/search') return json({ results: clone([giphyCat, giphyDog]) })
    if (method === 'POST' && path === '/api/resolve-image') return json({ imageUrl: this.generatedImage, videoUrl: null, source: null })
    if (method === 'POST' && path === '/api/aigen/image') return json({ imageUrl: this.generatedImage })
    if (method === 'POST' && path === '/api/aigen/image-edit') return json({ imageUrl: this.generatedImage })
    if (method === 'POST' && path === '/api/aigen/video') return json({ generationId: 'video-story' })
    if (method === 'GET' && path === '/api/aigen/video/video-story') return json({ status: 'video', videoUrl: 'https://media.example.test/generated.mp4' })
    if (method === 'POST' && path === '/api/uploads') return json({ uploadUrl: 'https://uploads.example.test/story', publicUrl: this.uploadedImage })
    if (method === 'PUT' && url.origin === 'https://uploads.example.test') return new Response(null, { status: 200 })

    return this.unexpectedLedger.record(request.method, request.path, request.body)
  }
}

let activeScenario: ConnectedScenario | null = null

export function setActiveScenario(scenario: ConnectedScenario | null): void {
  activeScenario = scenario
}

export function getActiveScenario(): ConnectedScenario {
  if (!activeScenario) throw new Error('No connected Storybook scenario is active')
  return activeScenario
}

export function createConnectedScenario(id: string, options?: ConnectedScenarioOptions): ConnectedScenario {
  return new ConnectedScenario(id, options)
}
