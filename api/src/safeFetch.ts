/**
 * SSRF-safe outbound fetch: public HTTP(S) only, private/link-local IPs blocked
 * after DNS and on every redirect hop, response body size capped.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const PRIVATE_HOST_RE =
  /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i

const MAX_REDIRECTS = 5
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024 // 5 MiB
const DEFAULT_TIMEOUT_MS = 8000

export class SafeFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

/** True for RFC1918, loopback, link-local, CGNAT, ULA, etc. */
export function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (v.includes(':')) {
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd')) return true // unique local
    if (v.startsWith('fe80')) return true // link-local
    if (v.startsWith('::ffff:')) {
      const mapped = v.slice('::ffff:'.length)
      if (mapped.includes('.')) return isPrivateIp(mapped)
    }
    return false
  }
  const parts = v.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return true // unparseable → treat as unsafe
  }
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a >= 224) return true // multicast / reserved
  return false
}

export async function assertPublicUrl(raw: string | URL): Promise<URL> {
  let url: URL
  try {
    url = typeof raw === 'string' ? new URL(raw) : raw
  } catch {
    throw new SafeFetchError('not a valid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeFetchError('only http(s) URLs are allowed')
  }
  if (url.username || url.password) {
    throw new SafeFetchError('URLs with credentials are not allowed')
  }
  const host = url.hostname
  if (!host || PRIVATE_HOST_RE.test(host)) {
    throw new SafeFetchError('private or local hostnames are not allowed')
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new SafeFetchError('private IP addresses are not allowed')
    return url
  }
  let addrs: { address: string; family: number }[]
  try {
    addrs = await lookup(host, { all: true, verbatim: true })
  } catch {
    throw new SafeFetchError('could not resolve host')
  }
  if (addrs.length === 0) throw new SafeFetchError('could not resolve host')
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new SafeFetchError('host resolves to a private IP address')
    }
  }
  return url
}

export type SafeFetchOptions = {
  headers?: Record<string, string>
  timeoutMs?: number
  maxBytes?: number
  /** When true, return headers + body buffer; when false, only validate + return Response after redirects. */
  readBody?: boolean
}

export type SafeFetchResult = {
  url: string
  status: number
  headers: Headers
  body: Buffer
}

/**
 * Fetch a URL with redirect re-validation and a hard body size cap.
 * Does not follow redirects automatically — each Location is checked again.
 */
export async function safeFetch(raw: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES
  let current = await assertPublicUrl(raw)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current.toString(), {
      method: 'GET',
      headers: opts.headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    }).catch((err: unknown) => {
      throw new SafeFetchError(err instanceof Error ? err.message : 'fetch failed')
    })

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new SafeFetchError('redirect without location')
      const next = new URL(loc, current)
      current = await assertPublicUrl(next)
      continue
    }

    if (!res.ok) {
      throw new SafeFetchError(`upstream returned ${res.status}`)
    }

    const len = res.headers.get('content-length')
    if (len && Number(len) > maxBytes) {
      throw new SafeFetchError('response too large')
    }

    const body = await readBodyCapped(res, maxBytes)
    return {
      url: current.toString(),
      status: res.status,
      headers: res.headers,
      body,
    }
  }
  throw new SafeFetchError('too many redirects')
}

async function readBodyCapped(res: Response, maxBytes: number): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      try {
        await reader.cancel()
      } catch {
        /* ignore */
      }
      throw new SafeFetchError('response too large')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)))
}
