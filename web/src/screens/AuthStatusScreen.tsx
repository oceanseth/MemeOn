import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { Icon } from '../atoms/Icon'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'
import type { AuthStatusScreenModel } from '../hooks/useAuthCallbackScreen'

/*
 * The auth status card (`Auth / Centered status`, boards `1NV-0` / `90A-0` / `93Q-0` / `953-0`):
 * a 560px raised card at the card radius with 40/32 of padding and everything inside it centred;
 * the iPhone board narrows the padding to 26 and lets the card fill the 350px column.
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

/* Unbounded 32/40 on the title tracking, as both auth boards letter their heading. `text-balance`
   is what the mobile board's 400px measure was for: "Returning to the MemeOn app…" breaks after
   "to the", not after "MemeOn", while a title that fits the card stays on one line. */
const TITLE = 'mb-0 text-balance font-display text-display-phone font-medium tracking-display text-ink'

const SUBTITLE = 'mt-3 mb-0 max-w-[420px] text-label text-ink-muted'

/** The board's quiet way out, beside the one coloured control: a 46px underlined text link. */
const TEXT_LINK = cn(
  'inline-flex h-[46px] items-center text-label font-semibold text-ink underline underline-offset-[3px]',
)

/** The same way out spelled inside a sentence (`953-0`): ultraviolet, underlined, no box. */
const INLINE_LINK = 'text-link underline underline-offset-[3px] decoration-1 font-medium'

/** One centred card for every auth hand-off: the OAuth callback and the mobile deep-link forward. */
export function AuthStatusScreen({
  phase,
  title,
  subtitle,
  error,
  primaryAction,
  fallback,
}: AuthStatusScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} className="pt-12 max-md:pt-8">
      <div data-slot="auth-status" data-phase={phase} className={CARD}>
        {phase === 'working' && <span aria-hidden="true" data-slot="auth-ring" className={RING} />}
        <h1 className={cn(TITLE, phase === 'working' && 'mt-[18px]')}>{title}</h1>
        {subtitle && <p className={SUBTITLE}>{subtitle}</p>}
        {error && (
          <Notice tone="error" compact>
            {error}
          </Notice>
        )}
        {primaryAction && (
          <a href={primaryAction.href} className={cn(buttonClasses('primary'), 'mt-5')}>
            <Icon name={primaryAction.icon} size={20} />
            {primaryAction.label}
          </a>
        )}
        {fallback.retry ? (
          <div data-slot="auth-timeout" className="mt-6 flex flex-col items-center gap-3">
            {fallback.prompt && <p className="m-0 text-label text-ink-muted">{fallback.prompt}</p>}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* ultraviolet, not bubblegum: a retry is the companion action, never the page's primary */}
              <Button variant="secondary" onClick={fallback.retry.onClick}>
                {fallback.retry.label}
              </Button>
              <Link data-slot="auth-web-fallback" to={fallback.home.to} className={TEXT_LINK}>
                {fallback.home.label}
              </Link>
            </div>
          </div>
        ) : (
          /* no retry to sit beside: the prompt and the way out read as one sentence (`953-0`) */
          <p data-slot="auth-timeout" className="mt-4 mb-0 text-label text-ink-muted">
            {fallback.prompt && <>{fallback.prompt} </>}
            <Link data-slot="auth-web-fallback" to={fallback.home.to} className={INLINE_LINK}>
              {fallback.home.label}
            </Link>
          </p>
        )}
      </div>
    </PageContainer>
  )
}
