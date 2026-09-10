import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions } from '../atoms/EmptyState'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'

/** UA paragraph rhythm, which preflight resets: `.muted` copy reads as prose, not a stack. */
const muted = cn('leading-[1.55] [margin-block:1em] text-text-dim')

/** Discord connect ritual as a function of its model. Every engine state is one set of args. */
export function DiscordLinkScreen({
  heading,
  showConfirm,
  showBusy,
  showDone,
  showError,
  busyMessage,
  errTitle,
  errBody,
  canRetry,
  onConfirm,
  onRetry,
}: DiscordLinkScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <div className="mx-auto max-w-[480px] pt-20 text-center max-md:pt-6">
        {/* one region for the whole ritual, mounted in every phase, so the swap is announced */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {heading && <h1 className="font-bold">{heading}</h1>}
          {showConfirm && (
            <>
              <p className={muted}>
                Your Discord name is never shown to other MemeOn users — <code>/memeon</code> just
                ranks your own binder 💼 and your friends' memes 🤝 first.
              </p>
              <EmptyActions>
                <Button variant="primary" onClick={onConfirm}>
                  Connect Discord
                </Button>
                <Link className={buttonClasses()} to="/discord">
                  Not now
                </Link>
              </EmptyActions>
            </>
          )}
          {showBusy && (
            <>
              <Spinner />
              <p className={muted}>{busyMessage}</p>
            </>
          )}
          {showDone && (
            <>
              <p className={muted}>
                Head back to Discord — <code>/memeon</code> now ranks your binder 💼 and friends'
                memes 🤝 first.
              </p>
              <EmptyActions>
                <Link className={buttonClasses()} to="/discord">
                  Back to MemeOn
                </Link>
              </EmptyActions>
            </>
          )}
        </div>
        {showError && (
          <>
            <h1 className="font-bold">{errTitle}</h1>
            <Notice tone="error">{errBody}</Notice>
            <EmptyActions>
              {canRetry && (
                <Button variant="primary" onClick={onRetry}>
                  Try again
                </Button>
              )}
              <Link className={buttonClasses()} to="/discord">
                Back to MemeOn
              </Link>
            </EmptyActions>
          </>
        )}
      </div>
    </PageContainer>
  )
}
