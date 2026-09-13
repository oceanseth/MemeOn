import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Icon } from '../atoms/Icon'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { GiftDialog } from '../molecules/GiftDialog'

/* search icon at 18px gutter → 50px input padding */
const SEARCH_WELL = 'relative flex w-full min-w-0 flex-1 md:max-w-142.5'
const SEARCH_GLYPH = 'pointer-events-none absolute top-1/2 left-control-x -translate-y-1/2 text-ink-muted'

/** Online strip is recessed so raised friend cards below read as actionable. */
const ONLINE_STRIP = cn(
  'mb-5 flex flex-wrap items-center gap-5 rounded-band bg-surface-pressed px-5 py-4 shadow-pressed',
  'max-sm:gap-3.5 max-sm:rounded-nav max-sm:px-gutter',
)

/** Fixed title width so avatar lanes align across strips. */
const ONLINE_TITLE = cn(
  'w-35 shrink-0 font-display text-card-title-phone font-medium tracking-card-title text-ink',
  'max-sm:w-full',
)

/** The presence dot: 10px, the success ink, never the only carrier of the fact (an sr-only says it). */
const DOT = 'inline-block size-2.5 shrink-0 rounded-full bg-success-text'

/** Person row: compact on desktop, stacked actions on phone. */
const ROW = cn(
  'flex items-center gap-3.5 rounded-card bg-surface px-5 py-3.5 shadow-raised',
  'max-sm:flex-col max-sm:items-stretch max-sm:gap-3.5 max-sm:rounded-nav max-sm:py-5',
)

const IDENTITY = cn(
  'flex min-w-0 flex-1 items-center gap-3.5 rounded-well text-inherit no-underline',
  FOCUS_RING,
)

const NAME = cn(
  'block truncate font-display text-card-title-phone font-medium tracking-card-title text-ink',
  '[overflow-wrap:anywhere]',
)

const META = 'mt-0.5 block truncate text-micro/[16px] font-medium text-ink-muted'

/* The action cluster: raised companion first, the row's one bubblegum second, the quiet exit last.
   On a phone the two pills share the 310px row and the text action keeps its own 44px target. */
const ACTIONS = 'flex shrink-0 items-center gap-3 max-sm:w-full max-sm:gap-3'

const ROW_PILL = 'max-sm:flex-1 max-sm:px-3'

/** Quiet exit as link-coloured text — confirm dialog carries the weight, not a red row button. */
const TEXT_ACTION = cn(
  'shrink-0 cursor-pointer rounded-control border-0 bg-transparent px-2.5 py-3.5',
  'text-small font-semibold text-link',
  FOCUS_RING,
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
  'pointer-coarse:min-h-11',
)

/** Pending is a pressed pill with no action behind it. */
const PENDING_PILL = cn(
  'inline-flex h-control shrink-0 items-center justify-center rounded-control px-control-x',
  'bg-surface-pressed text-label font-semibold text-ink-muted shadow-pressed',
)

const SECTION_HEADING = 'mt-8 mb-3 font-display text-title font-medium tracking-title text-ink'

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
    <div className={ROW} data-slot="person-row">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Link {...profileLinkProps} className={IDENTITY}>
          <Avatar name={name} src={avatarSrc} size="md" className="size-12" loading="lazy" />
          <span className="min-w-0 flex-1">
            <span className={NAME}>{name}</span>
            {statsLabel ? <span className={META}>{statsLabel}</span> : null}
          </span>
        </Link>
        {online ? (
          <>
            <span aria-hidden="true" className={DOT} />
            <span className="sr-only">{onlineLabel}</span>
          </>
        ) : null}
      </div>
      <div className={ACTIONS}>{children}</div>
    </div>
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
        <FilterBar className="w-full xl:justify-start!">
          <span className={SEARCH_WELL}>
            <Icon name="magnifying-glass" size={20} className={SEARCH_GLYPH} />
            <Input
              type="search"
              placeholder="Find people by name…"
              className="w-full pl-12.5"
              {...searchInputProps}
            />
          </span>
          <Button variant="primary" className="max-sm:w-full" {...inviteButtonProps}>
            {inviteLabel}
          </Button>
        </FilterBar>
      </PageHead>

      {showMsg && <Notice tone="ok">{msg}</Notice>}
      {showErr && <Notice tone="error">{err}</Notice>}

      {showSearchPanel && (
        <Panel className="mb-5">
          <h2 className="font-display text-card-title-phone font-medium tracking-card-title">Search results</h2>
          <div role="status">
            {showSearching && <p className="m-0 text-label text-ink-muted">{searchingLabel}</p>}
            {showNoHits && <p className="m-0 text-label text-ink-muted">{noHitsMessage}</p>}
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
        </Panel>
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
                  'group inline-flex items-center gap-2 rounded-well text-small text-ink no-underline',
                  FOCUS_RING,
                )}
              >
                <Avatar name={f.name} src={f.avatarSrc} size="md" loading="lazy" />
                <span className="max-sm:sr-only">{f.name}</span>
              </Link>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-micro/[16px] font-semibold text-ink-muted max-sm:ml-auto">
            <span aria-hidden="true" className={DOT} />
            {onlineCountLabel}
          </span>
        </div>
      ) : null}

      {showLoading ? (
        <div role="status" className="flex items-center justify-center gap-2.5 px-5 py-15 text-label text-ink-muted">
          <Spinner />
          {loadingLabel}
        </div>
      ) : showError ? (
        <EmptyState tone="error">
          <h2>{errorTitle}</h2>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        <EmptyState>
          <h2>{emptyTitle}</h2>
          <p>{emptyMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...emptyActionProps}>
              {inviteLabel}
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : null}

      {showCircle && (
        <>
          <h2 className={SECTION_HEADING}>Your circle</h2>
          <div className={SECTION}>
            {accepted.map((f) => (
              <PersonRow key={f.sub} {...f} online={f.isOnline} onlineLabel={f.onlineLabel}>
                <Link className={cn(buttonClasses(), ROW_PILL)} {...f.tradeLinkProps}>
                  <span aria-hidden="true">🔁</span> {f.tradeLabel}
                </Link>
                <Button variant="primary" className={ROW_PILL} {...f.giftButtonProps}>
                  <span aria-hidden="true">🎁</span> {f.giftLabel}
                </Button>
                <button className={TEXT_ACTION} {...f.removeButtonProps}>
                  {f.removeLabel}
                </button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showIncoming && (
        <>
          <h2 className={SECTION_HEADING}>Requests for you</h2>
          <div className={SECTION}>
            {incoming.map((f) => (
              <PersonRow key={f.sub} {...f}>
                <Button variant="primary" className={ROW_PILL} {...f.acceptButtonProps}>
                  Accept
                </Button>
                <button className={TEXT_ACTION} {...f.declineButtonProps}>
                  Decline
                </button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showOutgoing && (
        <>
          <h2 className={SECTION_HEADING}>Sent requests</h2>
          <div className={SECTION}>
            {outgoing.map((f) => (
              <PersonRow key={f.sub} {...f}>
                <span className={cn(PENDING_PILL, 'max-sm:flex-1')}>{f.pendingLabel}</span>
                <button className={TEXT_ACTION} {...f.cancelButtonProps}>
                  Cancel
                </button>
              </PersonRow>
            ))}
          </div>
        </>
      )}

      {showCircleHint ? <p className="mt-6 text-label text-ink-muted">{circleHintMessage}</p> : null}

      <GiftDialog model={giftDialog} />
      <ConfirmDialog model={removeDialog} />
    </PageContainer>
  )
}
