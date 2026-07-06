import type { SessionUser } from './session'

export interface Req {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  /** parsed JSON body ({} when absent/invalid) */
  body: Record<string, unknown>
  /** path params captured by the matched route pattern */
  params: Record<string, string>
  /** set by requireAuth routes */
  user: SessionUser
}

export interface Res {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export const json = (statusCode: number, data: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
})

export const html = (statusCode: number, body: string): Res => ({
  statusCode,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  body,
})

export const redirect = (location: string, cache = 'no-store'): Res => ({
  statusCode: 302,
  headers: { location, 'cache-control': cache },
  body: '',
})

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type Handler = (req: Req) => Promise<Res> | Res

interface Route {
  method: string
  segments: string[]
  handler: Handler
  auth: boolean
}

const routes: Route[] = []

function add(auth: boolean, spec: string, handler: Handler) {
  const [method, path] = spec.split(' ')
  routes.push({ method, segments: path.split('/').filter(Boolean), handler, auth })
}

/** Public route: `route('GET /api/foo/:id', handler)` */
export const route = (spec: string, handler: Handler) => add(false, spec, handler)
/** Route requiring a valid session; `req.user` is populated. */
export const authed = (spec: string, handler: Handler) => add(true, spec, handler)

export function matchRoute(
  method: string,
  path: string,
): { handler: Handler; auth: boolean; params: Record<string, string> } | null {
  const parts = path.split('/').filter(Boolean)
  for (const r of routes) {
    if (r.method !== method || r.segments.length !== parts.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < parts.length; i++) {
      const seg = r.segments[i]
      if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(parts[i])
      else if (seg !== parts[i]) {
        ok = false
        break
      }
    }
    if (ok) return { handler: r.handler, auth: r.auth, params }
  }
  return null
}

/** Masky access token forwarded by the client for credit-spending aigen calls. */
export function maskyToken(req: Req): string {
  const token = req.headers['x-masky-token']
  if (!token) throw new HttpError(400, 'missing x-masky-token header (re-login with Masky)')
  return token
}

export function requireString(body: Record<string, unknown>, key: string, maxLen = 2000): string {
  const v = body[key]
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `missing field: ${key}`)
  return v.trim().slice(0, maxLen)
}
