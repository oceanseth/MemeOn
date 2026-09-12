import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import { beginMaskyLogin, completeMaskyLogin } from '../lib/auth'
import { post } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { INVITE_KEY } from '../hooks/useInviteScreen'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/*
 * The auth status card (`Auth / Centered status`, boards `1NV-0` / `90A-0`): a 560px raised card
 * at the card radius with 40/32 of padding and everything inside it centred; the iPhone board
 * narrows the padding to 26 and lets the card fill the 350px column. The same recipe is spelled
 * out in `MobileAuthForward.tsx` — these two are Anatomy's legacy `pages/` exceptions and each
 * stays self-contained rather than growing a shared module below the tiers.
 */
const CARD = cn(
  'mx-auto flex w-full max-w-[560px] flex-col items-center justify-center text-center',
  'rounded-card border-0 bg-surface px-8 py-10 shadow-raised max-md:p-[26px]',
)

/**
 * The 38px ring: 3px of `line` with the action colour on top, turning. Reduced motion keeps the
 * same ring, static — the arc still reads as "one thing is still happening".
 */
const RING = cn(
  'size-[38px] shrink-0 rounded-full border-[3px] border-line border-t-action',
  'motion-safe:animate-spin',
  'forced-colors:border-[CanvasText] forced-colors:border-t-[Highlight]',
)

/** Unbounded 32/40 on the title tracking, as both auth boards letter their heading. */
const TITLE = 'mt-[18px] mb-0 font-display text-[32px]/[40px] font-medium tracking-title text-ink'

const SUBTITLE = 'mt-3 mb-0 max-w-[420px] text-label text-ink-muted'

/** The board's quiet way out, beside the one coloured control: a 46px underlined text link. */
const TEXT_LINK = cn(
  'inline-flex h-[46px] cursor-pointer items-center border-0 bg-transparent p-0',
  'text-label font-semibold text-ink underline underline-offset-[3px]',
  FOCUS_RING,
)

export default function AuthCallback() {
  useDocumentTitle('Completing Masky login')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // StrictMode double-mount; codes are single-use
    ran.current = true
    const code = params.get('code')
    if (!code) {
      setErr(params.get('error') ?? 'missing authorization code')
      return
    }
    completeMaskyLogin(code, params.get('state'))
      .then(async () => {
        // finish an invite if this login started from an invite link
        const inviterId = sessionStorage.getItem(INVITE_KEY)
        sessionStorage.removeItem(INVITE_KEY)
        if (inviterId) {
          await post('/api/invites/accept', { inviterId }).catch(() => {})
        }
        const postLogin = sessionStorage.getItem('memeon_post_login')
        sessionStorage.removeItem('memeon_post_login')
        await refresh()
        navigate(postLogin ?? (inviterId ? '/friends' : '/marketplace'), { replace: true })
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'login failed'))
  }, [params, navigate, refresh])

  /* The board's recovery row (`MHW-0`): a stalled or failed hand-off restarts the login instead of
     leaving the visitor on a ring. The successful path never renders this. */
  const retry = () => {
    setErr(null)
    void beginMaskyLogin().catch((e) => setErr(e instanceof Error ? e.message : 'login failed'))
  }

  return (
    <PageContainer as="main" id="main" tabIndex={-1} className="pt-12 max-md:pt-8">
      <div data-slot="auth-status" className={CARD}>
        {err ? (
          <>
            <h1 className={cn(TITLE, 'mt-0')}>Masky login didn’t finish</h1>
            <Notice tone="error" compact>{err}</Notice>
          </>
        ) : (
          <>
            <span aria-hidden="true" data-slot="auth-ring" className={RING} />
            <h1 className={TITLE}>Completing Masky login…</h1>
            <p className={SUBTITLE}>Taking you back to MemeOn.</p>
          </>
        )}
        <div data-slot="auth-timeout" className="mt-6 flex flex-col items-center gap-3">
          {err ? null : <p className="m-0 text-label text-ink-muted">Taking longer than usual?</p>}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* ultraviolet, not bubblegum: a retry is the companion action, never the page's primary */}
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
            <button type="button" onClick={() => navigate('/')} className={TEXT_LINK}>
              Back to MemeOn
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
