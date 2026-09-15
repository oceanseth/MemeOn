import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { Notice } from '@/atoms/notice'
import { PageContainer } from '@/atoms/page-container'
import { cn } from '../lib/cn'
import type { AuthStatusScreenModel } from '../hooks/useAuthCallbackScreen'

/** Centred auth status card — tighter padding on phone. */
const CARD = cn(
  'mx-auto flex w-full max-w-card flex-col items-center justify-center text-center',
  'rounded-lg material-card px-8 py-10 max-md:p-6.5',
)

/**
 * The 38px ring: 3px of `line` with the action colour on top, turning. Reduced motion keeps the
 * same ring, static — the arc still reads as "one thing is still happening".
 */
const RING = cn(
  'size-9.5 shrink-0 rounded-full border-3 border-border border-t-primary',
  'motion-safe:animate-spin',
  'forced-colors:border-fc-text forced-colors:border-t-fc-highlight',
)

/* text-balance keeps long titles from breaking mid-phrase on narrow cards */
const TITLE = 'mb-0 text-balance font-display text-display-phone font-medium tracking-display text-foreground'

const SUBTITLE = 'mt-3 mb-0 max-w-105 text-label text-muted-foreground'

/** Quiet way out beside the primary control. */
const TEXT_LINK = cn(
  'inline-flex h-control items-center text-label font-semibold text-foreground underline underline-offset-3',
)

/** Inline fallback link — ultraviolet, underlined, no box. */
const INLINE_LINK = 'text-link underline underline-offset-3 decoration-1 font-medium'

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
        <h1 className={cn(TITLE, phase === 'working' && 'mt-gutter')}>{title}</h1>
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
            {fallback.prompt && <p className="m-0 text-label text-muted-foreground">{fallback.prompt}</p>}
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
          /* no retry beside it: prompt and fallback read as one sentence */
          <p data-slot="auth-timeout" className="mt-4 mb-0 text-label text-muted-foreground">
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
