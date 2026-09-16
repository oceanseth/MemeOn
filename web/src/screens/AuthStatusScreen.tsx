import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Icon } from '@/atoms/icon'
import { InlineLink } from '@/atoms/inline-link'
import { PageContainer } from '@/atoms/page-container'
import { Spinner } from '@/atoms/spinner'
import { cn } from '../lib/cn'
import type { AuthStatusScreenModel } from '../hooks/useAuthCallbackScreen'

/** Centred auth status card — tighter padding on phone (`Card` allows its own spacing). */
const CARD = cn(
  'flex w-full flex-col items-center justify-center text-center',
  'px-8 py-10 max-md:p-6.5',
)

/* text-balance keeps long titles from breaking mid-phrase on narrow cards. `Heading size="section"`
   would drop this to 24px on the phone, which this one-line card does not want. */
const TITLE = 'mb-0 text-balance font-display text-4xl font-normal text-foreground'

const SUBTITLE = 'mt-3 mb-0 max-w-105 text-base text-muted-foreground'

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
      {/* the centred measure lives on the wrapper: `max-w-140` is a `--container-*` name the
          lint's grammar does not read */}
      <div className="mx-auto w-full max-w-140">
        <Card data-slot="auth-status" data-phase={phase} className={CARD}>
          {phase === 'working' && <Spinner size="lg" data-slot="auth-ring" />}
          <h1 className={cn(TITLE, phase === 'working' && 'mt-4.5')}>{title}</h1>
          {subtitle && <p className={SUBTITLE}>{subtitle}</p>}
          {error && (
            <Alert variant="error" size="compact" className="mt-3">
              {error}
            </Alert>
          )}
          {primaryAction && (
            <a href={primaryAction.href} className={cn(buttonVariants({ variant: 'primary' }), 'mt-5')}>
              <Icon name={primaryAction.icon} size={20} />
              {primaryAction.label}
            </a>
          )}
          {fallback.retry ? (
            <div data-slot="auth-timeout" className="mt-6 flex flex-col items-center gap-3">
              {fallback.prompt && <p className="m-0 text-base text-muted-foreground">{fallback.prompt}</p>}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* ultraviolet, not bubblegum: a retry is the companion action, never the page's primary */}
                <Button variant="brand" onClick={fallback.retry.onClick}>
                  {fallback.retry.label}
                </Button>
                {/* the quiet way out wears the button's box and the link's colour */}
                <Link
                  data-slot="auth-web-fallback"
                  to={fallback.home.to}
                  className={buttonVariants({ variant: 'link' })}
                >
                  {fallback.home.label}
                </Link>
              </div>
            </div>
          ) : (
            /* no retry beside it: prompt and fallback read as one sentence */
            <p data-slot="auth-timeout" className="mt-4 mb-0 text-base text-muted-foreground">
              {fallback.prompt && <>{fallback.prompt} </>}
              <InlineLink render={<Link data-slot="auth-web-fallback" to={fallback.home.to} />}>
                {fallback.home.label}
              </InlineLink>
            </p>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
