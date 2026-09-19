import { Link } from 'react-router-dom'
import { Alert, AlertAction } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Icon } from '@/atoms/icon'
import { Item, ItemMedia, ItemTitle } from '@/atoms/item'
import { PageContainer } from '@/atoms/page-container'
import { Spinner } from '@/atoms/spinner'
import { cn } from '../lib/cn'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'

const COLUMN = 'mx-auto max-w-255 text-center'

const TITLE = cn(
  'm-0 font-display text-5xl font-normal text-foreground',
  'max-md:text-2xl',
)

/** Row label inherits the band's tone — the command is plain text, not a code chip. */
const ROW_LABEL = 'm-0 text-sm font-semibold [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit'

/** Each phase names its own card; the lede above the rows never moves. */
const CARD_LEDE = 'm-0 mb-3 text-base font-semibold text-muted-foreground'

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
  connect,
  notNow,
  nextSteps,
  command,
  privacyLede,
  doneBody,
  tryAgain,
  backToBrand,
}: DiscordLinkScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <div className={cn(COLUMN, 'pt-14 max-md:pt-6')}>
        {/* the brain mark is the page's one ornament, and it is MemeOn's own, not Discord's — the
            ritual belongs to the account being linked. It is one of the Lucide stand-ins rather
            than a Paper-extracted Central glyph (see atoms/icon.tsx), so its eight lobe curves run
            dense at small sizes; at 64 every one of them is fully drawn. */}
        <p aria-hidden="true" className="m-0 text-6xl leading-none">
          <Icon name="brain" size={64} />
        </p>
        <h1 className={cn(TITLE, 'mt-2.5')}>{heading ?? errTitle}</h1>
        {showConfirm && (
          <>
            <p className="mx-auto mt-4 mb-0 max-w-[65ch] text-base text-muted-foreground">
              {privacyLede.before}<code>{command}</code>{privacyLede.after}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" onClick={onConfirm}>
                {connect}
              </Button>
              <Link className={buttonVariants()} to="/discord">
                {notNow}
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
          <Card size="sm">
            <p className={CARD_LEDE}>{nextSteps}</p>
            {showBusy && (
              <Item variant="muted">
                <ItemMedia>
                  <Spinner size="md" />
                </ItemMedia>
                <ItemTitle>{busyMessage}</ItemTitle>
              </Item>
            )}
            {showDone && (
              <Alert variant="success" className="block w-full max-w-none">
                <p className={ROW_LABEL}>
                  {doneBody.before}<code>{command}</code>{doneBody.after}
                </p>
                <AlertAction>
                  <Link className={buttonVariants({ size: 'sm' })} to="/discord">
                    {backToBrand}
                  </Link>
                </AlertAction>
              </Alert>
            )}
          </Card>
        )}
      </div>

      {showError && (
        <div className={cn(COLUMN, 'mt-8 text-left')}>
          <Card size="sm">
            <p className={CARD_LEDE}>{nextSteps}</p>
            <Alert variant="error" className="block w-full max-w-none">
              <p className={ROW_LABEL}>{errBody}</p>
              <AlertAction>
                {canRetry && (
                  <Button variant="primary" size="sm" onClick={onRetry}>
                    {tryAgain}
                  </Button>
                )}
                <Link className={buttonVariants({ size: 'sm' })} to="/discord">
                  {backToBrand}
                </Link>
              </AlertAction>
            </Alert>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
