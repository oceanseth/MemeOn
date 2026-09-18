import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Avatar } from '@/atoms/avatar'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardTitle } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { Heading } from '@/atoms/heading'
import { Icon } from '@/atoms/icon'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/atoms/input-group'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/atoms/item'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Spinner } from '@/atoms/spinner'
import { Toolbar } from '@/atoms/toolbar'
import { cn } from '../lib/cn'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { ConfirmDialog } from '@/molecules/confirm-dialog'
import { GiftDialog } from '@/molecules/gift-dialog'

/** The search well keeps its own width lane; the group inside owns the recess and the ring. */
const SEARCH_LANE = 'flex w-full min-w-0 flex-1 md:max-w-135'

/** Online strip is recessed so raised friend cards below read as actionable. */
const ONLINE_STRIP = cn(
  'mb-5 flex flex-wrap items-center gap-5 rounded-xl material-pressed px-5 py-4',
  'max-sm:gap-3.5 max-sm:rounded-lg max-sm:px-4.5',
)

/** Fixed title width so avatar lanes align across strips. */
const ONLINE_TITLE = cn(
  'w-35 shrink-0 text-lg font-semibold text-foreground',
  'max-sm:w-full',
)

/** The presence dot: 10px, the success ink, never the only carrier of the fact (an sr-only says it). */
const DOT = 'inline-block size-2.5 shrink-0 rounded-full bg-success-foreground'

const IDENTITY = cn(
  'flex min-w-0 flex-1 items-center gap-3.5 rounded-lg text-inherit no-underline',
  'focus-ring',
)

const META = 'block truncate text-xs font-medium text-muted-foreground'

/* The action cluster: raised companion first, the row's one bubblegum second, the quiet exit last.
   On a phone the two pills share the 310px row and the text action keeps its own 44px target. */
const ROW_PILL = 'max-sm:flex-1'

/** Pending is a pressed pill with no action behind it. */
const PENDING_PILL = cn(
  'inline-flex h-11.5 shrink-0 items-center justify-center rounded-lg px-4.5',
  'material-pressed text-base font-semibold text-muted-foreground',
)

const SECTION = 'flex flex-col gap-3.5'

/** One person, one card: the shared shell every section fills with its own actions. */
function PersonRow({
  name,
  avatarSrc,
  statsLabel,
  profileLinkProps,
  online,
  onlineLabel,
  children,
}: {
  name: string
  avatarSrc: string | null
  statsLabel?: string | undefined
  profileLinkProps: Pick<LinkProps, 'to'>
  online?: boolean
  onlineLabel?: string
  children: ReactNode
}) {
  return (
    <Item
      variant="raised"
      size="row"
      data-slot="person-row"
      className="max-sm:flex-col max-sm:items-stretch"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Link {...profileLinkProps} className={IDENTITY}>
          <Avatar name={name} src={avatarSrc} size="md" className="size-12" loading="lazy" />
          <ItemContent>
            <ItemTitle size="lg" truncate>
              {name}
            </ItemTitle>
            {statsLabel ? <span className={META}>{statsLabel}</span> : null}
          </ItemContent>
        </Link>
        {online ? (
          <>
            <span aria-hidden="true" className={DOT} />
            <span className="sr-only">{onlineLabel}</span>
          </>
        ) : null}
      </div>
      <ItemActions className="shrink-0 max-sm:w-full">{children}</ItemActions>
    </Item>
  )
}

/** Friends list as a function of its model. Every engine state is one set of args. */
export function FriendsScreen({
  hits,
  msg,
  err,
  inviteLabel,
  onlineFriends,
  onlineCountLabel,
  incoming,
  outgoing,
  accepted,
  showMsg,
  showErr,
  showOnline,
  showSearchPanel,
  showSearching,
  showHits,
  showNoHits,
  showIncoming,
  showOutgoing,
  showLoading,
  showError,
  showEmpty,
  showCircle,
  showCircleHint,
  searchingLabel,
  noHitsMessage,
  loadingLabel,
  errorTitle,
  errorMessage,
  retryLabel,
  retryButtonProps,
  emptyTitle,
  emptyMessage,
  emptyActionProps,
  circleHintMessage,
  searchInputProps,
  inviteButtonProps,
  giftDialog,
  removeDialog,
}: FriendsScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title="Friends">
        <Toolbar className="w-full lg:justify-start!">
          <span className={SEARCH_LANE}>
            <InputGroup>
              <InputGroupAddon>
                <Icon name="magnifying-glass" size={20} />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Find people by name…"
                {...searchInputProps}
              />
            </InputGroup>
          </span>
          <Button variant="primary" className="max-sm:w-full" {...inviteButtonProps}>
            <span aria-hidden="true">
              <Icon name="mail" size={16} />
            </span>{' '}
            {inviteLabel}
          </Button>
        </Toolbar>
      </PageHead>

      {showMsg && <Alert variant="success" className="mt-3">{msg}</Alert>}
      {showErr && <Alert variant="error" className="mt-3">{err}</Alert>}

      {showSearchPanel && (
        <Card className="mb-5">
          <CardTitle render={<h2 />}>Search results</CardTitle>
          <div role="status">
            {showSearching && <p className="m-0 text-base text-muted-foreground">{searchingLabel}</p>}
            {showNoHits && <p className="m-0 text-base text-muted-foreground">{noHitsMessage}</p>}
          </div>
          {showHits && (
            <div className={cn(SECTION, 'mt-3.5')}>
              {hits.map((u) => (
                <PersonRow key={u.sub} {...u}>
                  <Button variant="primary" className={ROW_PILL} {...u.requestButtonProps}>
                    Add friend
                  </Button>
                </PersonRow>
              ))}
            </div>
          )}
        </Card>
      )}

      {showOnline ? (
        <div className={ONLINE_STRIP} data-slot="online-now">
          <span className={ONLINE_TITLE}>Online now</span>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {onlineFriends.map((f) => (
              <Link
                key={f.sub}
                {...f.onlineLinkProps}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-lg text-sm text-foreground no-underline',
                  'focus-ring',
                )}
              >
                <Avatar name={f.name} src={f.avatarSrc} size="md" loading="lazy" />
                <span className="max-sm:sr-only">{f.name}</span>
              </Link>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground max-sm:ml-auto">
            <span aria-hidden="true" className={DOT} />
            {onlineCountLabel}
          </span>
        </div>
      ) : null}

      {showLoading ? (
        <div role="status" className="flex items-center justify-center gap-2.5 px-5 py-15 text-base text-muted-foreground">
          <Spinner />
          {loadingLabel}
        </div>
      ) : showError ? (
        <Empty variant="error">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{errorTitle}</EmptyTitle>
            <EmptyDescription>{errorMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
          </EmptyContent>
        </Empty>
      ) : showEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...emptyActionProps}>
              {inviteLabel}
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {showCircle && (
        <>
          <Heading as="h2" className="mt-8 mb-3">
            Your circle
          </Heading>
          <div className={SECTION}>
            {accepted.map((f) => (
              <PersonRow key={f.sub} {...f} online={f.isOnline} onlineLabel={f.onlineLabel}>
                <Link className={cn(buttonVariants(), ROW_PILL)} {...f.tradeLinkProps}>
                  <span aria-hidden="true">
                    <Icon name="arrows-swap" size={16} />
                  </span>{' '}
                  {f.tradeLabel}
                </Link>
                <Button variant="primary" className={ROW_PILL} {...f.giftButtonProps}>
                  <span aria-hidden="true">
                    <Icon name="gift" size={16} />
                  </span>{' '}
                  {f.giftLabel}
                </Button>
                {/* the quiet exit: link-coloured, the confirm dialog carries the weight */}
                <Button variant="link" size="sm" className="shrink-0" {...f.removeButtonProps}>
                  {f.removeLabel}
                </Button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showIncoming && (
        <>
          <Heading as="h2" className="mt-8 mb-3">
            Requests for you
          </Heading>
          <div className={SECTION}>
            {incoming.map((f) => (
              <PersonRow key={f.sub} {...f}>
                <Button variant="primary" className={ROW_PILL} {...f.acceptButtonProps}>
                  Accept
                </Button>
                <Button variant="link" size="sm" className="shrink-0" {...f.declineButtonProps}>
                  Decline
                </Button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showOutgoing && (
        <>
          <Heading as="h2" className="mt-8 mb-3">
            Sent requests
          </Heading>
          <div className={SECTION}>
            {outgoing.map((f) => (
              <PersonRow key={f.sub} {...f}>
                <span className={cn(PENDING_PILL, 'max-sm:flex-1')}>{f.pendingLabel}</span>
                <Button variant="link" size="sm" className="shrink-0" {...f.cancelButtonProps}>
                  Cancel
                </Button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showCircleHint ? <p className="mt-6 text-base text-muted-foreground">{circleHintMessage}</p> : null}

      <GiftDialog model={giftDialog} />
      <ConfirmDialog model={removeDialog} />
    </PageContainer>
  )
}
