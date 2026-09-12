import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { SkeletonRow } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import type { LeaderboardRowModel, LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'

const skeletonRows = [0, 1, 2, 3, 4]

/**
 * The count colour: bubblegum-700 in light, bubblegum-300 in dark (`plan-buckets.md` › top-brains,
 * "Count colours (focus → bubblegum-700/300)"). Both are shipped ramp tokens, so this is the ramp
 * flipping with the theme rather than a literal.
 */
const COUNT = 'font-sans font-extrabold text-[light-dark(var(--color-bubblegum-700),var(--color-bubblegum-300))] tabular-nums'

/**
 * One ordered list carries the whole board: the top three wear the podium card, everyone after them
 * the 62px ranked row (`CMC-0` › `COR-0` / `CPF-0`). Splitting them into two lists would tell a
 * screen reader the ranking restarts at four, so the grid does the splitting instead.
 */
const BOARD = cn(
  'm-0 grid list-none grid-cols-3 gap-5 p-0',
  /* the span must be breakpoint-scoped: on the phone's single column it would mint two implicit
     tracks and put the podium back in a row */
  'md:[&>li:nth-child(n+4)]:col-span-3',
  'max-md:grid-cols-1 max-md:gap-3.5',
)

/* The podium card: a raised column, medal over avatar over name over count. #1 takes the board's
   2px action border on `surface-raised`; #2 and #3 stay on the plain surface. */
const PODIUM = cn(
  'flex h-full flex-col items-center rounded-[28px] bg-surface px-5 pt-[18px] pb-5 text-center shadow-raised',
  'max-md:flex-row max-md:items-center max-md:gap-3 max-md:rounded-[24px] max-md:px-5 max-md:py-3.5 max-md:text-left',
)
const PODIUM_FIRST = 'bg-surface-raised border-2 border-action'

/* The ranked row: a raised card, the rank numeral in the display face, the count pinned right. */
const RANK_ROW = cn(
  'flex items-center gap-3 rounded-[28px] bg-surface p-5 shadow-raised',
  'max-md:rounded-[24px] max-md:px-[18px] max-md:py-3.5',
)
const RANK_ROW_ME = 'bg-surface-raised border-2 border-action-secondary'

const ROW_LINK = cn(
  'text-inherit no-underline',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px',
  'transition-transform duration-(--dur-fast) ease-[ease] motion-reduce:transition-none',
  'motion-reduce:hover:translate-y-0!',
)

const NAME = 'min-w-0 flex-1 truncate font-display text-[16px]/[20px] font-medium tracking-title text-ink'

const RANK_NUMERAL = 'w-7 shrink-0 text-center font-display text-[18px]/[22px] font-medium tracking-title text-ink-muted'

/** A rank: the board's 62px row, also the shape the pinned "You" line takes under the list. */
function RankRow({ leader, youLabel }: { leader: LeaderboardRowModel; youLabel: string }) {
  return (
    <Link
      {...leader.profileLinkProps}
      aria-label={leader.linkLabel}
      data-slot="person-row"
      className={cn(ROW_LINK, RANK_ROW, leader.isMe && RANK_ROW_ME)}
    >
      <span className={RANK_NUMERAL}>{leader.rankNumeral}</span>
      <Avatar name={leader.name} src={leader.avatarSrc} size="md" className="size-9 rounded-[13px]" loading="lazy" />
      <span className={NAME}>{leader.name}</span>
      {leader.isMe ? (
        <Badge tone="info" className="shrink-0">
          {youLabel}
        </Badge>
      ) : null}
      <span className={cn(COUNT, 'shrink-0 text-[15px]/[19px] whitespace-nowrap')}>{leader.braincellsLabel}</span>
    </Link>
  )
}

/** Top Brains as a function of its model. Every engine state is one set of args. */
export function LeaderboardScreen({
  subtitle,
  podiumTitle,
  podiumSubtitle,
  columnHeaders,
  leaders,
  youRow,
  showMore,
  showMoreLabel,
  showMoreButtonProps,
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
      <PageHead level="h1" title="🏆 Top Brains" subtitle={subtitle} className="mb-5" />

      {/* one small live region for every phase: the list itself never gets read back wholesale */}
      <div role="status" aria-live="polite" aria-busy={showLoading}>
        {showLoading ? (
          <>
            <span className="sr-only">{loadingMessage}</span>
            <div className="flex flex-col gap-3.5" aria-hidden="true">
              {skeletonRows.map((row) => (
                <SkeletonRow key={row} />
              ))}
            </div>
          </>
        ) : null}
        {showList ? <span className="sr-only">{listSummary}</span> : null}
      </div>

      {showEmpty ? <EmptyState>{emptyMessage}</EmptyState> : null}

      {showError ? (
        <EmptyState tone="error">
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button onClick={retry}>{retryLabel}</Button>
          </EmptyActions>
        </EmptyState>
      ) : null}

      {showList ? (
        <>
          <div className="mb-5" data-slot="podium-head">
            <h2 className="m-0 font-display text-[34px]/[42px] font-medium tracking-title text-ink max-md:text-[26px]/[32px]">
              {podiumTitle}
            </h2>
            <p className="m-0 mt-1.5 text-body text-ink-muted">{podiumSubtitle}</p>
          </div>

          {/* the board's second heading ("Ranked by braincell holdings") names the list rather than
              splitting it: one <ol> keeps the ranking from restarting at four for a screen reader */}
          <ol className={BOARD} data-slot="leaderboard" aria-label={columnHeaders.player}>
            {leaders.map((l, index) =>
              index < 3 ? (
                <li key={l.sub}>
                  <Link
                    {...l.profileLinkProps}
                    aria-label={l.linkLabel}
                    data-slot="person-row"
                    className={cn(ROW_LINK, 'block h-full')}
                  >
                    <span className={cn(PODIUM, index === 0 && PODIUM_FIRST)}>
                      <span aria-hidden="true" className="text-[25px]/[31px] max-md:text-[20px]/[24px]">
                        {l.medalLabel}
                      </span>
                      <Avatar
                        name={l.name}
                        src={l.avatarSrc}
                        size="md"
                        className="size-[50px] rounded-[18px] md:mt-2.5 max-md:size-9 max-md:rounded-[13px]"
                        loading="lazy"
                      />
                      <span
                        className={cn(
                          NAME,
                          'md:mt-2.5 md:w-full md:flex-none md:text-center max-md:min-w-0',
                        )}
                      >
                        {l.name}
                      </span>
                      {l.isMe ? (
                        <Badge tone="info" className="shrink-0 md:mt-2">
                          {youLabel}
                        </Badge>
                      ) : null}
                      <span className={cn(COUNT, 'text-[19px]/[24px] md:mt-2 max-md:text-[15px]/[19px]')}>
                        {l.braincellsLabel}
                      </span>
                    </span>
                  </Link>
                </li>
              ) : (
                <li key={l.sub}>
                  <RankRow leader={l} youLabel={youLabel} />
                </li>
              ),
            )}
          </ol>

          {youRow ? (
            <div className="mt-3.5" data-slot="your-rank">
              <RankRow leader={youRow} youLabel={youLabel} />
            </div>
          ) : null}

          {showMore ? (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" className="w-[220px] max-sm:w-full" {...showMoreButtonProps}>
                {showMoreLabel}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageContainer>
  )
}
