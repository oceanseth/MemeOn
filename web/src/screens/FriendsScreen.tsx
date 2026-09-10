import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { GiftDialog } from '../molecules/GiftDialog'

const onlineDot = 'inline-block size-[9px] rounded-full bg-ok shadow-[0_0_8px_var(--color-ok)]'

const identityLink = cn(
  'group flex min-w-0 flex-1 items-center gap-3 rounded-control text-inherit no-underline',
  'pointer-coarse:min-h-11',
)

const personName = 'min-w-0 truncate font-semibold group-hover:text-accent'

const personRow = cn(
  'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-border bg-bg-raised p-3',
  '[&>*]:min-w-0',
)

/** Friends list as a function of its model. Every engine state is one set of args. */
export function FriendsScreen({
  hits,
  msg,
  err,
  inviteLabel,
  onlineFriends,
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
      <PageHead title="Friends">
        <FilterBar>
          <Input type="search" placeholder="Find people by name…" {...searchInputProps} />
          <Button variant="primary" {...inviteButtonProps}>
            {inviteLabel}
          </Button>
        </FilterBar>
      </PageHead>

      {showMsg && <Notice tone="ok">{msg}</Notice>}
      {showErr && <Notice tone="error">{err}</Notice>}

      {showOnline ? (
        <Panel className="mb-5 flex flex-wrap items-center gap-3 font-semibold">
          <span aria-hidden="true" className={onlineDot} /> Online now
          <div className="flex flex-wrap gap-3.5">
            {onlineFriends.map((f) => (
              <Link
                key={f.sub}
                {...f.onlineLinkProps}
                className={cn(
                  'group inline-flex items-center gap-1.5 text-sm text-text no-underline',
                  'pointer-coarse:min-h-11 pointer-coarse:gap-2 pointer-coarse:rounded-pill',
                  'pointer-coarse:bg-bg-raised pointer-coarse:py-1 pointer-coarse:pr-3 pointer-coarse:pl-1',
                )}
              >
                <Avatar name={f.name} src={f.avatarSrc} size="sm" loading="lazy" />
                <span className="underline decoration-1 underline-offset-[3px] decoration-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] group-hover:decoration-accent">
                  {f.name}
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

      {showSearchPanel && (
        <Panel className="mb-5">
          <h3>Search results</h3>
          <div role="status">
            {showSearching && <p className="m-0 text-text-dim">{searchingLabel}</p>}
            {showNoHits && <p className="m-0 text-text-dim">{noHitsMessage}</p>}
          </div>
          {showHits && (
            <div className="flex flex-col gap-2.5">
              {hits.map((u) => (
                <div className={personRow} data-slot="person-row" key={u.sub}>
                  <Link {...u.profileLinkProps} className={identityLink}>
                    <Avatar name={u.name} src={u.avatarSrc} size="md" className="max-sm:size-8" loading="lazy" />
                    <span className={personName}>{u.name}</span>
                  </Link>
                  <Button variant="primary" className="shrink-0" {...u.requestButtonProps}>
                    Add friend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {showIncoming && (
        <>
          <h3 className="mt-6 mb-2 text-lg font-bold">Requests for you</h3>
          <div className="mb-[22px] flex flex-col gap-2.5">
            {incoming.map((f) => (
              <div className={personRow} data-slot="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className={identityLink}>
                  <Avatar name={f.name} src={f.avatarSrc} size="md" className="max-sm:size-8" loading="lazy" />
                  <span className={personName}>{f.name}</span>
                </Link>
                <Button variant="primary" className="shrink-0" {...f.acceptButtonProps}>
                  Accept
                </Button>
                <Button variant="danger" className="shrink-0" {...f.declineButtonProps}>
                  Decline
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {showOutgoing && (
        <>
          <h3 className="mt-6 mb-2 text-lg font-bold">Requests you sent</h3>
          <div className="mb-[22px] flex flex-col gap-2.5">
            {outgoing.map((f) => (
              <div className={personRow} data-slot="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className={identityLink}>
                  <Avatar name={f.name} src={f.avatarSrc} size="md" className="max-sm:size-8" loading="lazy" />
                  <span className={personName}>{f.name}</span>
                </Link>
                <Badge className="shrink-0">{f.pendingLabel}</Badge>
                <Button className="shrink-0" {...f.cancelButtonProps}>
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {showLoading ? (
        <div role="status" className="flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-text-dim">
          <Spinner />
          {loadingLabel}
        </div>
      ) : showError ? (
        <EmptyState error>
          <h3 className="font-bold">{errorTitle}</h3>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        <EmptyState>
          <h3 className="font-bold">{emptyTitle}</h3>
          <p>{emptyMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...emptyActionProps}>
              {inviteLabel}
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : showCircleHint ? (
        <p className="text-text-dim">{circleHintMessage}</p>
      ) : showCircle ? (
        <>
          <h3 className="mt-6 mb-2 text-lg font-bold">Your circle</h3>
          <div className="flex flex-col gap-2.5">
            {accepted.map((f) => (
              <div className={personRow} data-slot="person-row" key={f.sub}>
                <Link {...f.profileLinkProps} className={identityLink}>
                  <Avatar name={f.name} src={f.avatarSrc} size="md" className="max-sm:size-8" loading="lazy" />
                  <div className="min-w-0">
                    <div className={cn(personName, 'truncate')}>
                      {f.name}
                      {f.isOnline && (
                        <>
                          <span aria-hidden="true" className={cn(onlineDot, 'ml-2')} />
                          <span className="sr-only">{f.onlineLabel}</span>
                        </>
                      )}
                    </div>
                    <div className="truncate text-xs text-text-dim">{f.statsLabel}</div>
                  </div>
                </Link>
                <Button variant="primary" className="shrink-0" {...f.giftButtonProps}>
                  <span aria-hidden="true">🎁</span> {f.giftLabel}
                </Button>
                <button
                  className="shrink-0 rounded-control px-2.5 py-2 text-danger pointer-coarse:min-h-11"
                  {...f.removeButtonProps}
                >
                  {f.removeLabel}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <GiftDialog model={giftDialog} />
      <ConfirmDialog model={removeDialog} />
    </PageContainer>
  )
}
