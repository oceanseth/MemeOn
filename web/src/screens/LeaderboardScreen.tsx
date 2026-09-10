import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Button } from '../atoms/Button'
import { SkeletonRow } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import type { LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'

const skeletonRows = [0, 1, 2, 3, 4]

const rankClasses = (hasMedal: string) =>
  cn(
    'w-10 shrink-0 text-center text-[20px] font-extrabold',
    'max-sm:w-6 max-sm:text-lg',
    hasMedal && 'max-sm:hidden',
  )

const medalClasses = (hasMedal: string) =>
  cn('w-6 shrink-0 text-center text-lg leading-none', hasMedal ? 'max-sm:text-base' : 'max-sm:hidden')

const leaderRowClasses = (isMe: boolean) =>
  cn(
    'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border bg-bg-raised p-3 text-text no-underline',
    'transition-[border-color] duration-(--dur-base) ease motion-reduce:transition-none',
    'hover:border-accent',
    'max-sm:gap-2 max-sm:px-2.5',
    isMe ? 'border-accent' : 'border-border',
  )

/** Top Brains as a function of its model. Every engine state is one set of args. */
export function LeaderboardScreen({
  subtitle,
  columnHeaders,
  leaders,
  showLoading,
  loadingMessage,
  showEmpty,
  emptyMessage,
  showError,
  errorMessage,
  retryLabel,
  retry,
  showList,
  listSummary,
  youLabel,
}: LeaderboardScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead
        title={
          <>
            🏆 Top Brains{' '}
            <img
              className="inline-block h-[26px] w-[26px] rounded-full object-cover align-middle"
              src="/api/brand/braincell.png"
              alt=""
              width={26}
              height={26}
            />
          </>
        }
        subtitle={subtitle}
      />

      {/* one small live region for every phase: the list itself never gets read back wholesale */}
      <div role="status" aria-live="polite" aria-busy={showLoading}>
        {showLoading ? (
          <>
            <span className="sr-only">{loadingMessage}</span>
            <div className="flex flex-col gap-2.5" aria-hidden="true">
              {skeletonRows.map((row) => (
                <SkeletonRow key={row} />
              ))}
            </div>
          </>
        ) : null}
        {showEmpty ? <EmptyState>{emptyMessage}</EmptyState> : null}
        {showList ? <span className="sr-only">{listSummary}</span> : null}
      </div>

      {showError ? (
        <EmptyState error>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button onClick={retry}>{retryLabel}</Button>
          </EmptyActions>
        </EmptyState>
      ) : null}

      {showList ? (
        <>
          <div className="flex justify-between px-3 pb-1.5 text-xs text-text-dim" aria-hidden="true">
            <span>{columnHeaders.player}</span>
            <span>{columnHeaders.braincells}</span>
          </div>
          <ol className="flex flex-col gap-2.5">
            {leaders.map((l) => (
              <li key={l.sub}>
                <Link
                  {...l.profileLinkProps}
                  aria-label={l.linkLabel}
                  data-slot="person-row"
                  className={leaderRowClasses(l.isMe)}
                >
                  <span className={rankClasses(l.medalLabel)}>{l.rankNumeral}</span>
                  <span aria-hidden="true" className={medalClasses(l.medalLabel)}>
                    {l.medalLabel}
                  </span>
                  <Avatar name={l.name} src={l.avatarSrc} size="md" className="max-sm:size-8" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{l.name}</div>
                    <div className="truncate text-xs text-text-dim max-sm:overflow-visible max-sm:text-clip max-sm:whitespace-normal">
                      <span>{l.collectionLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{l.portfolioLabel}</span>
                    </div>
                  </div>
                  {l.isMe ? (
                    <Badge state className="shrink-0">
                      {youLabel}
                    </Badge>
                  ) : null}
                  <span className="shrink-0 text-base font-extrabold text-gold tabular-nums whitespace-nowrap">
                    {l.braincellsLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </PageContainer>
  )
}
