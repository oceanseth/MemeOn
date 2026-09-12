import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { buttonClasses } from '../atoms/Button'
import { Icon } from '../atoms/Icon'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'

/*
 * Masky OAuth only allows https redirect URIs, so the mobile app uses
 * https://{host}/auth/mobile as its redirect target. This page immediately
 * forwards the code/state into the app via the memeon:// deep link.
 *
 * The chrome is the auth status card (`Auth / Centered status`, boards `93Q-0` / `953-0`), the
 * same recipe `AuthCallback.tsx` spells out: a 560px raised card, 40/32 of padding (26 on the
 * phone board), everything centred, with the 38px ring above the heading.
 */
const CARD = cn(
  'mx-auto flex w-full max-w-[560px] flex-col items-center justify-center text-center',
  'rounded-card border-0 bg-surface px-8 py-10 shadow-raised max-md:p-[26px]',
)

const RING = cn(
  'size-[38px] shrink-0 rounded-full border-[3px] border-line border-t-action',
  'motion-safe:animate-spin',
  'forced-colors:border-[CanvasText] forced-colors:border-t-[Highlight]',
)

/* the board holds the heading to a 400px measure so it breaks after "to the", not after "MemeOn" */
const TITLE = cn(
  'mt-[18px] mb-0 max-w-[400px] font-display text-[32px]/[40px] font-medium tracking-title text-ink',
)

const SUBTITLE = 'mt-3 mb-0 max-w-[420px] text-label text-ink-muted'

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
    <PageContainer as="main" id="main" tabIndex={-1} className="pt-12 max-md:pt-8">
      <div data-slot="auth-status" className={CARD}>
        <span aria-hidden="true" data-slot="auth-ring" className={RING} />
        <h1 className={TITLE}>Returning to the MemeOn app…</h1>
        <p className={SUBTITLE}>Open the MemeOn app, or keep going on the web.</p>
        {/* the one primary on the page; the arrow is the board's Central glyph, not an emoji */}
        <a href={deepLink} className={cn(buttonClasses('primary'), 'mt-5')}>
          <Icon name="arrow-right" size={20} />
          Open MemeOn
        </a>
        <p data-slot="auth-web-fallback" className="mt-4 mb-0 text-label text-ink-muted">
          Nothing happened?{' '}
          <Link
            to="/"
            className="text-link underline underline-offset-[3px] decoration-1 font-medium"
          >
            Continue on the web
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}
