import { vi } from 'vitest'

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

export function pathOf(input: RequestInfo | URL): string {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return new URL(value, window.location.origin).pathname
}

export function bodyOf(init?: RequestInit): Record<string, unknown> {
  return init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
}

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const result = Response.json(body, init)
  result.text = async () => JSON.stringify(body)
  return result
}

export async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

/** A macrotask that survives fake timers, so React's lazy route can actually resolve. */
export function macrotask(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    channel.port2.postMessage(null)
  })
}

function stubWebStorage(kind: 'localStorage' | 'sessionStorage'): void {
  const storage = new Map<string, string>()
  vi.stubGlobal(kind, {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
  })
}

export function stubSessionStorage(): void {
  stubWebStorage('sessionStorage')
}

export function stubLocalStorage(): void {
  stubWebStorage('localStorage')
}

/** Like Chromium, a detached call (`const w = clipboard.writeText; w(text)`) rejects with Illegal invocation. */
export function stubClipboardWrite(writeText: (text: string) => Promise<void>): void {
  const clipboard = {
    writeText(this: unknown, text: string) {
      if (this !== clipboard) return Promise.reject(new TypeError('Illegal invocation'))
      return writeText(text)
    },
  }
  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: clipboard,
    })
  } catch {
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(function (this: unknown, text) {
      if (this !== navigator.clipboard) return Promise.reject(new TypeError('Illegal invocation'))
      return writeText(text)
    })
  }
}
