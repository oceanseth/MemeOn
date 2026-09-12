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

/* The board's search well: 570 wide, the 50px recessed field with the glass at its 18px gutter
   (18 + 20 + 12 = 50 before the value). Friends · Desktop `92-0` › `ACW-0`. */
const SEARCH_WELL = 'relative flex w-full min-w-0 flex-1 md:max-w-[570px]'
const SEARCH_GLYPH = 'pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-ink-muted'

/* "Online now" is a recessed strip, not a card: the board sinks it into the page (`AD4-0`,
   pressed material, radius 28, 20/16 padding) so the raised friend cards under it read as the
   things you can act on. */
const ONLINE_STRIP = cn(
  'mb-5 flex flex-wrap items-center gap-5 rounded-[28px] bg-surface-pressed px-5 py-4 shadow-pressed',
  'max-sm:gap-3.5 max-sm:rounded-nav max-sm:px-[18px]',
)

/* The 140px title slot the board fixes so every strip lines its avatars up on the same lane. */
const ONLINE_TITLE = cn(
  'w-[140px] shrink-0 font-display text-[17px]/[21px] font-medium tracking-title text-ink',
  'max-sm:w-full',
)

/** The presence dot: 10px, the success ink, never the only carrier of the fact (an sr-only says it). */
const DOT = 'inline-block size-2.5 shrink-0 rounded-full bg-success-text'

/* A person: one raised surface card holding the 48px avatar, a flexible identity lane and the row's
   own action cluster. The board fixes the desktop card at **76px** (`ADI-0`: height 76, radius 28,
   gap 14, avatar `ADJ-0` 48) — 48 + 2×14, so the nominal 20 padding it reports is the horizontal
   one; 20 top and bottom would draw the 88px row the frame is not. The phone card keeps the full
   20 all round because the board says so out loud: `AJA-0` is 148 = 20 + 48 (identity `LYG-0`) + 14
   + 46 (actions `AJI-0`) + 20. */
const ROW = cn(
  'flex items-center gap-3.5 rounded-[28px] bg-surface px-5 py-3.5 shadow-raised',
  'max-sm:flex-col max-sm:items-stretch max-sm:gap-3.5 max-sm:rounded-nav max-sm:py-5',
)

const IDENTITY = cn(
  'flex min-w-0 flex-1 items-center gap-3.5 rounded-[20px] text-inherit no-underline',
  FOCUS_RING,
)

const NAME = cn(
  'block truncate font-display text-[17px]/[21px] font-medium tracking-title text-ink',
  '[overflow-wrap:anywhere]',
)

const META = 'mt-0.5 block truncate text-micro/[16px] font-medium text-ink-muted'

/* The action cluster: raised companion first, the row's one bubblegum second, the quiet exit last.
   On a phone the two pills share the 310px row and the text action keeps its own 44px target. */
const ACTIONS = 'flex shrink-0 items-center gap-3 max-sm:w-full max-sm:gap-3'

const ROW_PILL = 'max-sm:flex-1 max-sm:px-3'

/**
 * The quiet exit (Remove / Decline / Cancel). The board draws it as bare text in the accent the
 * ring is drawn in, because the weight of the decision lives in the confirm dialog, not in a red
 * button on a list row. `--color-focus` is a ring colour, though — it reads Lc −53 on the dark
 * surface — so the text takes `--color-link`, which is the same idea inside the contrast floor.
 */
const TEXT_ACTION = cn(
  'shrink-0 cursor-pointer rounded-control border-0 bg-transparent px-2.5 py-3.5',
  'text-small font-semibold text-link',
  FOCUS_RING,
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
  'pointer-coarse:min-h-11',
)

/** "Pending" is a state, not a control: the board's pressed pill with no press behind it. */
const PENDING_PILL = cn(
  'inline-flex h-[46px] shrink-0 items-center justify-center rounded-control px-[18px]',
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
          {/* 48 on both boards — the phone identity row `LYG-0` is 48 tall because `AJB-0` is */}
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
              className="w-full pl-[50px]"
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
          <h2 className="font-display text-[17px]/[21px] font-medium tracking-title">Search results</h2>
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
                  'group inline-flex items-center gap-2 rounded-[20px] text-small text-ink no-underline',
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
