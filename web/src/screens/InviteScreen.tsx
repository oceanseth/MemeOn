import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { InviteScreenModel } from '../hooks/useInviteScreen'
import { binderCardSlotClasses, binderGridClasses } from './BinderScreen'

/* The hero is one raised card that grows with its copy (`DAL-0` › `DAY-0`: radius 28, 20/28
   padding, a 7px column gap, everything centred on the avatar). */
const HERO = cn(
  'flex flex-col items-center gap-[7px] rounded-[28px] bg-surface px-5 pt-5 pb-7 text-center shadow-raised',
  'max-sm:rounded-nav max-sm:px-[18px]',
)

const HERO_AVATAR = 'size-[90px] rounded-[33px] max-sm:size-[78px] max-sm:rounded-[28px]'

/* The name is the page's display step (44/55, 32/40 on a phone); the verb line is one rung down. */
const HERO_NAME = cn(
  'block font-display text-display font-medium tracking-display text-ink',
  'max-md:text-display-phone [overflow-wrap:anywhere]',
)
const HERO_VERB = cn(
  'block font-display text-section-phone font-medium tracking-title text-ink',
  'md:text-section',
)

const HERO_STATS = 'm-0 mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-label font-semibold text-ink-muted'

const HERO_BODY = 'm-0 mt-4 max-w-[560px] text-intro font-medium text-ink-muted [text-wrap:pretty]'

const HERO_NOTE = 'm-0 mt-3 max-w-[65ch] text-label font-medium text-ink-muted [text-wrap:pretty]'

const SECTION_HEADING = 'mt-8 mb-3.5 font-display text-title font-medium tracking-title text-ink'

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
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
}: InviteScreenModel) {
  if (showFatalError)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <PageHead level="h1" title={fatalActions.title} className="mb-5" />
        <EmptyState tone="error">
          <p>{err}</p>
          <EmptyActions>
            <Button variant="primary" {...fatalActions.joinButtonProps}>
              {fatalActions.joinLabel}
            </Button>
            <Link className={buttonClasses()} to={fatalActions.homeHref}>
              {fatalActions.homeLabel}
            </Link>
          </EmptyActions>
        </EmptyState>
      </PageContainer>
    )

  if (showSpinner)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <div
          role="status"
          aria-busy="true"
          className="flex items-center justify-center gap-2.5 px-5 py-15 text-label text-ink-muted"
        >
          <Spinner />
          {loadingLabel}
        </div>
      </PageContainer>
    )

  if (!inviter) return null

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title="You’re invited" className="mb-5" />

      <section className={HERO} data-slot="invite-hero">
        <Avatar name={inviter.name} src={inviter.avatarSrc} size="lg" loading="eager" className={HERO_AVATAR} />
        <h2 className="m-0 mt-3.5">
          <span className={HERO_NAME}>{inviter.name}</span>{' '}
          <span className={HERO_VERB}>invited you to MemeOn</span>
        </h2>
        <p className={HERO_STATS}>
          {inviter.stats.map((stat, index) => (
            <span key={stat.id} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              <span aria-hidden="true">{stat.emoji}</span> {stat.value} {stat.label}
            </span>
          ))}
        </p>
        <p className={HERO_BODY}>{inviteBody}</p>

        {selfActions ? (
          <>
            <Notice tone="ok">{selfActions.note}</Notice>
            <EmptyActions>
              <Button variant="primary" {...selfActions.copyButtonProps}>
                {selfActions.copyLabel}
              </Button>
              <Link className={buttonClasses()} to={selfActions.friendsHref}>
                {selfActions.friendsLabel}
              </Link>
            </EmptyActions>
            <span className="sr-only" role="status">
              {selfActions.copyStatusMessage}
            </span>
          </>
        ) : showAcceptSuccess ? null : (
          // the offer retires once it is taken: the confirmation below is the whole state
          <EmptyActions>
            <Button variant="primary" className="max-sm:w-full" {...acceptButtonProps}>
              {acceptLabel}
            </Button>
          </EmptyActions>
        )}
        {showAcceptError && <Notice tone="error">{acceptErrorMessage}</Notice>}
        {showAcceptSuccess && <Notice tone="ok">{acceptSuccessMessage}</Notice>}
        <p className={HERO_NOTE}>{inviter.acceptanceNote}</p>
      </section>

      {showHighlights && (
        <>
          <h2 className={SECTION_HEADING}>{highlightsTitle}</h2>
          <ul className={binderGridClasses}>
            {cards.map((card) => (
              <li key={card.id} className={binderCardSlotClasses}>
                <MemeCard model={card.memeCard} />
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-label text-ink-muted">{climbNote}</p>
        </>
      )}
    </PageContainer>
  )
}
