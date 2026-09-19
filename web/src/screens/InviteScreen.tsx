import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Avatar } from '@/atoms/avatar'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription } from '@/atoms/empty'
import { Heading } from '@/atoms/heading'
import { MemeCard } from '@/molecules/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Spinner } from '@/atoms/spinner'
import { cn } from '../lib/cn'
import type { InviteScreenModel } from '../hooks/useInviteScreen'
import { binderCardSlotClasses, binderGridClasses } from '../lib/binderChrome'
import { Icon } from '@/atoms/icon'

/* The name is the page's own step (5xl, 4xl on a phone); the verb line is one rung down. */
const HERO_NAME = cn(
  'block font-display text-5xl font-normal text-foreground',
  'max-md:text-4xl wrap-anywhere',
)
const HERO_VERB = cn(
  'block font-display text-2xl font-normal text-foreground',
  'md:text-4xl',
)

const HERO_STATS = 'm-0 mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base font-semibold text-muted-foreground'

const HERO_BODY = 'm-0 mt-4 max-w-140 text-lg text-muted-foreground text-pretty'

const HERO_NOTE = 'm-0 mt-3 max-w-[65ch] text-base font-medium text-muted-foreground text-pretty'

/** The hero's own action row: the invite's one primary and its quiet companion. */
const HERO_ACTIONS = 'mt-4.5 flex flex-wrap items-center justify-center gap-2.5'

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
  pageTitle,
  heroVerb,
  err,
  showFatalError,
  showSpinner,
  showAcceptError,
  showAcceptSuccess,
  showHighlights,
  loadingLabel,
  acceptErrorMessage,
  acceptSuccessMessage,
  highlightsTitle,
  acceptLabel,
  inviteBody,
  climbNote,
  fatalActions,
  selfActions,
  inviter,
  cards,
  acceptButtonProps,
  acceptIcon,
}: InviteScreenModel) {
  if (showFatalError)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <PageHead level="h1" title={fatalActions.title} className="mb-5" />
        <Empty variant="error">
          <EmptyDescription>{err}</EmptyDescription>
          <EmptyContent>
            <Button variant="primary" {...fatalActions.joinButtonProps}>
              <span aria-hidden="true">
                <Icon name="theater" size={16} />
              </span>{' '}
              {fatalActions.joinLabel}
            </Button>
            <Link className={buttonVariants()} to={fatalActions.homeHref}>
              {fatalActions.homeLabel}
            </Link>
          </EmptyContent>
        </Empty>
      </PageContainer>
    )

  if (showSpinner)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <div
          role="status"
          aria-busy="true"
          className="flex items-center justify-center gap-2.5 px-5 py-15 text-base text-muted-foreground"
        >
          <Spinner />
          {loadingLabel}
        </div>
      </PageContainer>
    )

  if (!inviter) return null

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={pageTitle} className="mb-5" />

      <Card size="sm" data-slot="invite-hero" className="flex flex-col items-center gap-2 text-center">
        <Avatar name={inviter.name} src={inviter.avatarSrc} size="hero" loading="eager" />
        <h2 className="m-0 mt-3.5">
          <span className={HERO_NAME}>{inviter.name}</span>{' '}
          <span className={HERO_VERB}>{heroVerb}</span>
        </h2>
        <p className={HERO_STATS}>
          {inviter.stats.map((stat, index) => (
            <span key={stat.id} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              <span aria-hidden="true">
                <Icon name={stat.icon} size={16} />
              </span>{' '}
              {stat.value} {stat.label}
            </span>
          ))}
        </p>
        <p className={HERO_BODY}>{inviteBody}</p>

        {selfActions ? (
          <>
            <Alert variant="success" className="mt-3">{selfActions.note}</Alert>
            <div className={HERO_ACTIONS}>
              <Button variant="primary" {...selfActions.copyButtonProps}>
                <span aria-hidden="true">
                  <Icon name="link" size={16} />
                </span>{' '}
                {selfActions.copyLabel}
              </Button>
              <Link className={buttonVariants()} to={selfActions.friendsHref}>
                {selfActions.friendsLabel}
              </Link>
            </div>
            <span className="sr-only" role="status">
              {selfActions.copyStatusMessage}
            </span>
          </>
        ) : showAcceptSuccess ? null : (
          // the offer retires once it is taken: the confirmation below is the whole state
          <div className={HERO_ACTIONS}>
            <Button variant="primary" className="max-sm:w-full" {...acceptButtonProps}>
              <span aria-hidden="true">
                <Icon name={acceptIcon} size={16} />
              </span>{' '}
              {acceptLabel}
            </Button>
          </div>
        )}
        {showAcceptError && <Alert variant="error" className="mt-3">{acceptErrorMessage}</Alert>}
        {showAcceptSuccess && <Alert variant="success" className="mt-3">{acceptSuccessMessage}</Alert>}
        <p className={HERO_NOTE}>{inviter.acceptanceNote}</p>
      </Card>

      {showHighlights && (
        <>
          <Heading as="h2" className="mt-8 mb-3.5">
            {highlightsTitle}
          </Heading>
          <ul className={binderGridClasses}>
            {cards.map((card) => (
              <li key={card.id} className={binderCardSlotClasses}>
                <MemeCard model={card.memeCard} />
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-base text-muted-foreground">{climbNote}</p>
        </>
      )}
    </PageContainer>
  )
}
