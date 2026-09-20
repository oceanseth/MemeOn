import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Avatar } from '@/atoms/avatar'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Skeleton, SkeletonBlock, SkeletonCard } from '@/atoms/skeleton'
import { cn } from '../lib/cn'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'
import { binderGridClasses } from '../lib/binderChrome'
import { ProfileShelf } from '@/organisms/profile-shelf'
import { Icon } from '@/atoms/icon'

const SKELETON_CARDS = ['a', 'b', 'c', 'd']

/* identity card: min height floor so wrapped content can grow past the avatar row */
const IDENTITY_CARD = 'mb-5 flex flex-wrap items-center gap-x-3.5 gap-y-4'

const IDENTITY_LINE =
  'm-0 truncate font-display text-3xl font-normal text-foreground wrap-anywhere'

const META_LINE = 'm-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-muted-foreground'

/** The friend state is a caption, not a pill: a standing fact never competes with the actions. */
const FRIEND_CAPTION = 'm-0 mt-1.5 text-base font-semibold text-muted-foreground'

const ACTIONS = 'flex flex-wrap items-center gap-3 max-sm:w-full max-sm:*:flex-1'

/** Public binder hero: bare row, intro below the avatar row at page edge. */
const BINDER_HERO = 'flex items-center gap-4 max-sm:items-start'
const BINDER_HERO_STACK = 'mt-5 mb-10 flex flex-col gap-2.5'
/** Binder intro is label weight, not PageHead subtitle. */
const BINDER_INTRO = 'm-0 text-base text-muted-foreground'

/** `/u/:sub` identity Card, or `/binder/:sub` non-owner hero when `showBinderHero`. */
export function ProfileScreen({
  showErr,
  errTitle,
  errBody,
  retryLabel,
  retryButtonProps,
  errorLinkLabel,
  errorLinkProps,
  showLoading,
  loadingLabel,
  title,
  intro,
  identityLine,
  showBinderHero,
  profile,
  showActions,
  tradeLabel,
  tradeLinkProps,
  shareLabel,
  shareButtonProps,
  showSelfActions,
  settingsLabel,
  settingsLinkProps,
  followButtonVariant,
  followGlyph,
  followText,
  followButtonProps,
  showFriendButton,
  friendGlyph,
  friendText,
  friendButtonProps,
  showFriendChip,
  friendChipGlyph,
  friendChipText,
  showActionErr,
  actionErr,
  showJoin,
  joinLabel,
  joinAddFriendLabel,
  joinLinkProps,
  reshareNote,
  actionsGroupLabel,
  tabsListLabel,
  createdTabLabel,
  binderTabLabel,
  cards,
  gridCountLabel,
  showMore,
  showMoreLabel,
  showMoreButtonProps,
  showEmpty,
  emptyTitle,
  emptyBody,
  showEmptyLink,
  emptyLinkLabel,
  emptyLinkProps,
  showGrid,
  tabsProps,
  gridProps,
}: ProfileScreenModel) {
  if (showErr)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <Empty variant="error">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{errTitle}</EmptyTitle>
            <EmptyDescription>{errBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
            <Link className={buttonVariants()} {...errorLinkProps}>
              {errorLinkLabel}
            </Link>
          </EmptyContent>
        </Empty>
      </PageContainer>
    )
  if (showLoading || !profile)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <div role="status" aria-live="polite" className="sr-only">{loadingLabel}</div>
        <Card size="sm" className={cn(IDENTITY_CARD, 'mt-5 sm:min-h-34.5')} aria-hidden="true">
          <Skeleton variant="avatar" className="size-21.5 max-sm:size-18.5" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="mb-2.5 h-7.5 w-55 max-w-full" />
            <SkeletonBlock className="w-65 max-w-full" />
          </div>
        </Card>
        <ul className={binderGridClasses} aria-hidden="true">
          {SKELETON_CARDS.map((key) => (
            <li key={key}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      </PageContainer>
    )

  const visitorActions = showActions ? (
    <div className={ACTIONS} role="group" aria-label={actionsGroupLabel}>
      {showFriendButton && (
        <Button variant="primary" {...friendButtonProps}>
          <span aria-hidden="true">
            <Icon name={friendGlyph!} size={16} />
          </span>{' '}
          {friendText}
        </Button>
      )}
      <Button variant={followButtonVariant} {...followButtonProps}>
        <span aria-hidden="true">
          <Icon name={followGlyph} size={16} />
        </span>{' '}
        {followText}
      </Button>
      <Link className={buttonVariants()} {...tradeLinkProps}>
        <span aria-hidden="true">
          <Icon name="arrows-swap" size={16} />
        </span>{' '}
        {tradeLabel}
      </Link>
    </div>
  ) : null

  const statsLine = (
    <p className={META_LINE}>
      {profile.stats.map((stat, index) => (
        <span key={stat.id} className="inline-flex items-center gap-1.5">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {stat.glyph ? (
            <span aria-hidden="true">
              <Icon name={stat.glyph} size={16} />
            </span>
          ) : null}
          {stat.text}
        </span>
      ))}
    </p>
  )

  const friendChip = showFriendChip ? (
    <p className={FRIEND_CAPTION} data-slot="friend-state">
      <span aria-hidden="true">
        <Icon name={friendChipGlyph!} size={18} />
      </span>{' '}
      {friendChipText}
    </p>
  ) : null

  let identityChrome
  if (showBinderHero) {
    identityChrome = (
      <div className={BINDER_HERO_STACK}>
        <header className={BINDER_HERO} data-slot="profile-identity">
          <Avatar
            name={profile.name}
            src={profile.avatarSrc}
            size="public"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <PageHead level="h1" title={title} className="m-0" />
            {statsLine}
            {friendChip}
          </div>
        </header>
        {intro ? <p className={BINDER_INTRO}>{intro}</p> : null}
        {visitorActions}
      </div>
    )
  } else {
    const publicView = showJoin
    identityChrome = (
      <>
        <PageHead level="h1" title={title} {...(intro ? { subtitle: intro } : {})} className="mb-3.5" />
        <Card
          size="sm"
          className={cn(IDENTITY_CARD, !publicView && 'sm:min-h-34.5')}
          data-slot="profile-identity"
        >
          <Avatar
            name={profile.name}
            src={profile.avatarSrc}
            size={publicView ? 'public' : 'hero'}
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            {identityLine ? <p className={IDENTITY_LINE}>{identityLine}</p> : null}
            {statsLine}
            {friendChip}
          </div>
          {visitorActions}
          {showSelfActions && (
            <div className={ACTIONS} role="group" aria-label={actionsGroupLabel}>
              <Button {...shareButtonProps}>
                <span aria-hidden="true">
                  <Icon name="link" size={16} />
                </span>{' '}
                {shareLabel}
              </Button>
              <Link className={buttonVariants()} {...settingsLinkProps}>
                {settingsLabel}
              </Link>
            </div>
          )}
          {showJoin && (
            <div className={ACTIONS}>
              <Button {...shareButtonProps}>
                <span aria-hidden="true">
                  <Icon name="link" size={16} />
                </span>{' '}
                {shareLabel}
              </Button>
              <Link className={buttonVariants()} {...joinLinkProps}>
                {joinAddFriendLabel}
              </Link>
            </div>
          )}
        </Card>
      </>
    )
  }

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {identityChrome}

      {showActionErr && <Alert variant="error" className="mt-3">{actionErr}</Alert>}

      <ProfileShelf
        tabsListLabel={tabsListLabel}
        createdTabLabel={createdTabLabel}
        binderTabLabel={binderTabLabel}
        cards={cards}
        gridCountLabel={gridCountLabel}
        showMore={showMore}
        showMoreLabel={showMoreLabel}
        showMoreButtonProps={showMoreButtonProps}
        showEmpty={showEmpty}
        emptyTitle={emptyTitle}
        emptyBody={emptyBody}
        showEmptyLink={showEmptyLink}
        emptyLinkLabel={emptyLinkLabel}
        emptyLinkProps={emptyLinkProps}
        showGrid={showGrid}
        tabsProps={tabsProps}
        gridProps={gridProps}
      />

      {showJoin && (
        <div className="mt-9 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 max-sm:w-full max-sm:*:w-full">
            {showBinderHero ? (
              <Button {...shareButtonProps}>
                <span aria-hidden="true">
                  <Icon name="link" size={16} />
                </span>{' '}
                {shareLabel}
              </Button>
            ) : null}
            <Link className={cn(buttonVariants({ variant: 'primary' }), 'max-sm:w-full')} {...joinLinkProps}>
              {joinLabel}
            </Link>
          </div>
          <p className="m-0 text-base text-muted-foreground">{reshareNote}</p>
        </div>
      )}
    </PageContainer>
  )
}
