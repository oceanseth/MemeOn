import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buttonClasses } from '../atoms/Button'
import { PageContainer } from '../atoms/PageContainer'

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
    <PageContainer as="main" id="main" tabIndex={-1} className="pt-[90px] text-center">
      <p className="[margin-block:1em] text-text-dim">Returning to the MemeOn app…</p>
      <p className="[margin-block:1em]">
        <a href={deepLink} className={buttonClasses('primary')}>
          Open MemeOn
        </a>
      </p>
    </PageContainer>
  )
}
