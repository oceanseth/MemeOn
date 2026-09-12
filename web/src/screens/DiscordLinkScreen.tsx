import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { PageContainer } from '../atoms/PageContainer'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'

const COLUMN = 'mx-auto max-w-255 text-center'

const TITLE = cn(
  'm-0 font-display text-display font-medium tracking-display text-ink',
  'max-md:text-section-phone',
)

const ROW = cn(
  'flex flex-wrap items-center justify-between gap-4 rounded-control px-4 py-3',
  'max-md:flex-col max-md:items-start max-md:gap-2.5 max-md:px-3.5',
)

/** Row label inherits tone colour — command is plain text, not a code chip. */
const ROW_LABEL = 'm-0 text-small font-semibold [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit'

/**
 * The row's own action is 40 tall, not the page's 46: it answers the row, not the page. A finger
 * still gets 44 — at any width, because a touch screen is not always a narrow one.
 */
const ROW_ACTION = 'h-10 shrink-0 max-md:h-11 pointer-coarse:min-h-11'

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
      <div className={cn(COLUMN, 'pt-14 max-md:pt-6')}>
        {/* the brain mark is the page's one ornament and stays an emoji */}
        <p aria-hidden="true" className="m-0 text-[48px]/[60px]">
          🧠
        </p>
        <h1 className={cn(TITLE, 'mt-2.5')}>{heading ?? errTitle}</h1>
        {showConfirm && (
          <>
            <p className="mx-auto mt-4 mb-0 max-w-measure text-body text-ink-muted">
              Your Discord name is never shown to other MemeOn users — <code>/memeon</code> just
              ranks your own binder 💼 and your friends' memes 🤝 first.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" onClick={onConfirm}>
                Connect Discord
              </Button>
              <Link className={buttonClasses()} to="/discord">
                Not now
              </Link>
            </div>
          </>
        )}
      </div>

      {/* one region for the whole ritual, mounted in every phase, so the swap is announced */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(COLUMN, 'mt-8 text-left empty:mt-0')}
      >
        {(showBusy || showDone) && (
          <Panel className="p-5.5 max-md:p-gutter">
            <p className="m-0 mb-3 text-label font-semibold text-ink-muted">What happens next</p>
            {showBusy && (
              <div className={cn(ROW, 'bg-canvas-alt max-md:flex-row max-md:items-center')}>
                <span className="flex items-center gap-3">
                  <Spinner className="size-6 border-3" />
                  <span className="text-label font-semibold text-ink">{busyMessage}</span>
                </span>
              </div>
            )}
            {showDone && (
              <div className={cn(ROW, 'bg-success-surface')}>
                <p className={cn(ROW_LABEL, 'text-success-text')}>
                  Head back to Discord — <code>/memeon</code> now ranks your binder 💼 and friends'
                  memes 🤝 first.
                </p>
                <Link className={cn(buttonClasses(), ROW_ACTION)} to="/discord">
                  Back to MemeOn
                </Link>
              </div>
            )}
          </Panel>
        )}
      </div>

      {showError && (
        <div className={cn(COLUMN, 'mt-8 text-left')}>
          <Panel className="p-5.5 max-md:p-gutter">
            <p className="m-0 mb-3 text-label font-semibold text-ink-muted">What happens next</p>
            <div className={cn(ROW, 'bg-error-surface')} role="alert">
              <p className={cn(ROW_LABEL, 'text-error-text')}>{errBody}</p>
              <span className="flex shrink-0 flex-wrap items-center gap-2.5">
                {canRetry && (
                  <Button variant="primary" className={ROW_ACTION} onClick={onRetry}>
                    Try again
                  </Button>
                )}
                <Link className={cn(buttonClasses(), ROW_ACTION)} to="/discord">
                  Back to MemeOn
                </Link>
              </span>
            </div>
          </Panel>
        </div>
      )}
    </PageContainer>
  )
}
