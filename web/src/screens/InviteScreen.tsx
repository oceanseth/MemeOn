import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Button } from '../atoms/Button'
import { EmptyActions } from '../atoms/EmptyState'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { Spinner } from '../atoms/Spinner'
import type { InviteScreenModel } from '../hooks/useInviteScreen'

const statSeparator =
  "[&:not(:last-child)]:after:ml-2.5 [&:not(:last-child)]:after:text-text-dim [&:not(:last-child)]:after:content-['·']"

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
  err,
  showFatalError,
  showSpinner,
  showAcceptError,
  showAcceptSuccess,
  showAcceptSpinner,
  showHighlights,
  loadingLabel,
  acceptErrorMessage,
  acceptSuccessMessage,
  highlightsTitle,
  acceptLabel,
  fatalActions,
  selfActions,
  inviter,
  cards,
  acceptButtonProps,
}: InviteScreenModel) {
  if (showFatalError)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <section className="px-4 pt-[72px] pb-6 text-center">
          <h1 className="m-0 mb-3.5 text-[clamp(34px,6vw,60px)] leading-[1.05] font-bold">{fatalActions.title}</h1>
          <Notice tone="error">{err}</Notice>
          <EmptyActions>
            <Button variant="login" {...fatalActions.joinButtonProps}>
              {fatalActions.joinLabel}
            </Button>
            <Link to={fatalActions.homeHref}>{fatalActions.homeLabel}</Link>
          </EmptyActions>
        </section>
      </PageContainer>
    )

  if (showSpinner)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <div role="status" aria-busy="true" className="flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-text-dim">
          <Spinner />
          {loadingLabel}
        </div>
      </PageContainer>
    )

  if (!inviter) return null

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <section className="px-4 pt-[72px] pb-6 text-center">
        <Avatar name={inviter.name} src={inviter.avatarSrc} size="lg" loading="eager" className="mx-auto mb-3.5 block" />
        <h1 className="m-0 mb-3.5 text-[clamp(34px,6vw,60px)] leading-[1.05] font-bold">
          <span className="bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-gold))] bg-clip-text text-transparent">
            {inviter.name}
          </span>{' '}
          invited you to MemeOn
        </h1>
        <ul className="mb-[18px] flex flex-wrap justify-center gap-2.5 text-sm text-text">
          {inviter.stats.map((stat) => (
            <li key={stat.id} className={statSeparator}>
              <span aria-hidden="true">{stat.emoji}</span> {stat.value} {stat.label}
            </li>
          ))}
        </ul>
        <p className="mx-auto mb-7 max-w-[640px] text-lg text-text-dim [text-wrap:pretty]">
          MemeOn turns memes into trading cards. Mint them, watch them climb foil rarity tiers as
          their share links spread, and invest in your friends' bangers before they go ✨Shiny✨.
        </p>
        {selfActions ? (
          <>
            <Notice tone="ok">{selfActions.note}</Notice>
            <EmptyActions>
              <Button variant="login" {...selfActions.copyButtonProps}>
                {selfActions.copyLabel}
              </Button>
              <Link to={selfActions.friendsHref}>{selfActions.friendsLabel}</Link>
            </EmptyActions>
            <span className="sr-only" role="status">
              {selfActions.copyStatusMessage}
            </span>
          </>
        ) : showAcceptSuccess ? null : (
          // the offer retires once it is taken: the confirmation below is the whole state
          <EmptyActions>
            <Button variant="login" {...acceptButtonProps}>
              {showAcceptSpinner && <Spinner />}
              {acceptLabel}
            </Button>
          </EmptyActions>
        )}
        {showAcceptError && <Notice tone="error">{acceptErrorMessage}</Notice>}
        {showAcceptSuccess && <Notice tone="ok">{acceptSuccessMessage}</Notice>}
        <p className="mx-auto mt-4 mb-0 max-w-[46ch] text-sm text-text-dim [text-wrap:pretty]">
          {inviter.acceptanceNote}
        </p>
      </section>

      {showHighlights && (
        <>
          <h2 className="mx-0 mt-2.5 mb-1.5 text-[26px] font-bold">{highlightsTitle}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 max-sm:grid-cols-2 max-sm:gap-3">
            {cards.map((card) => (
              <MemeCard key={card.id} model={card.memeCard} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}
