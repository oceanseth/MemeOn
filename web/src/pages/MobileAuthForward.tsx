import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Masky OAuth only allows https redirect URIs, so the mobile app uses
 * https://{host}/auth/mobile as its redirect target. This page immediately
 * forwards the code/state into the app via the memeon:// deep link.
 */
export default function MobileAuthForward() {
  const [params] = useSearchParams()

  const deepLink = useMemo(() => {
    const q = new URLSearchParams()
    for (const key of ['code', 'state', 'error']) {
      const v = params.get(key)
      if (v) q.set(key, v)
    }
    return `memeon://auth?${q.toString()}`
  }, [params])

  useEffect(() => {
    window.location.replace(deepLink)
  }, [deepLink])

  return (
    <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
      <p style={{ color: 'var(--text-dim)' }}>Returning to the MemeOn app…</p>
      <p>
        <a href={deepLink}>
          <button className="primary">Open MemeOn</button>
        </a>
      </p>
    </main>
  )
}
