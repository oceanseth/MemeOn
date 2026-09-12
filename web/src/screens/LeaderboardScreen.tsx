import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { SkeletonRow } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import type { LeaderboardRowModel, LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'

const skeletonRows = [0, 1, 2, 3, 4]

/**
 * The count colour: bubblegum-700 in light, bubblegum-300 in dark (`plan-buckets.md` › top-brains,
 * "Count colours (focus → bubblegum-700/300)"). Both are shipped ramp tokens, so this is the ramp
 * flipping with the theme rather than a literal.
 */
const COUNT = 'font-sans font-extrabold text-[light-dark(var(--color-bubblegum-700),var(--color-bubblegum-300))] tabular-nums'

/**
 * The podium panel the board draws (`CMC-0` › `COM-0`): one raised card, 1108×252 at 20 padding,
 * holding the head on the left (`CON-0`, max 300) and the three 218-wide cards 40 further in, 20
 * apart. It stacks under `md`.
 */
const PODIUM_PANEL = cn(
  'mb-5 flex items-center gap-10 rounded-card bg-surface p-5 shadow-raised',
  'max-md:flex-col max-md:items-stretch max-md:gap-5',
)

/**
 * Two lists, not one: the podium is inside the panel and the ladder continues beside it. Each row's
 * accessible name already states its rank (`rowLabel` in `useLeaderboardScreen`), so the split
 * cannot make a screen reader think the ranking restarts at four.
 */
const PODIUM_LIST = cn('m-0 flex list-none gap-5 p-0', 'max-md:flex-col max-md:gap-3.5')
const BOARD = 'm-0 flex list-none flex-col gap-5 p-0 max-md:gap-3.5'

/* The podium card: a raised 218-wide column, medal over avatar over name over count (`COR-0`). #1
   takes the board's 2px action border on `surface-raised`; #2 and #3 stay on the plain surface. */
const PODIUM = cn(
  'flex h-full flex-col items-center rounded-[28px] bg-surface px-5 pt-[18px] pb-5 text-center shadow-raised',
  'md:w-[218px]',
  'max-md:flex-row max-md:items-center max-md:gap-3 max-md:rounded-nav max-md:px-5 max-md:py-3.5 max-md:text-left',
)
const PODIUM_FIRST = 'bg-surface-raised border-2 border-action'

/* The ranked row (`CPF-0`): 1108×62 — 13 + the 36 avatar + 13 — 12 gap, the rank numeral in the
   display face, the count pinned right. */
const RANK_ROW = cn(
  'flex items-center gap-3 rounded-[28px] bg-surface px-5 py-[13px] shadow-raised',
  'max-md:rounded-nav max-md:px-[18px] max-md:py-3.5',
)
const RANK_ROW_ME = 'bg-surface-raised border-2 border-action-secondary'

const ROW_LINK = cn(
  'text-inherit no-underline',
  FOCUS_RING,
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
      <span className={cn(COUNT, 'shrink-0 text-label whitespace-nowrap')}>{leader.braincellsLabel}</span>
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
          {/* the board's podium (`CMC-0` › `COM-0`): one raised panel holding the head and the
              three 218-wide cards, with the rest of the ladder as its own list beside it */}
          <div className={PODIUM_PANEL} data-slot="podium">
            <div className="max-w-[300px] flex-1" data-slot="podium-head">
              <h2 className="m-0 font-display text-[34px]/[42px] font-medium tracking-title text-ink max-md:text-[26px]/[32px]">
                {podiumTitle}
              </h2>
              <p className="m-0 mt-1.5 text-body text-ink-muted">{podiumSubtitle}</p>
            </div>

            <ol className={PODIUM_LIST} data-slot="podium-cards" aria-label={podiumTitle}>
              {leaders.slice(0, 3).map((l) => (
                <li key={l.sub}>
                  <Link
                    {...l.profileLinkProps}
                    aria-label={l.linkLabel}
                    data-slot="person-row"
                    className={cn(ROW_LINK, 'block h-full')}
                  >
                    <span className={cn(PODIUM, l.rankNumeral === '1' && PODIUM_FIRST)}>
                      <span aria-hidden="true" className="text-[25px]/[31px] max-md:text-[20px]/[24px]">
                        {l.medalLabel}
                      </span>
                      <Avatar
                        name={l.name}
                        src={l.avatarSrc}
                        size="md"
                        className="size-[50px] rounded-field md:mt-2.5 max-md:size-9 max-md:rounded-[13px]"
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
                      <span className={cn(COUNT, 'text-[19px]/[24px] md:mt-2 max-md:text-label')}>
                        {l.braincellsLabel}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          {/* the board's second heading ("Ranked by braincell holdings") names the ladder rather
              than splitting it: every row's accessible name already carries its own rank */}
          {leaders.length > 3 ? (
            <ol className={BOARD} data-slot="leaderboard" aria-label={columnHeaders.player}>
              {leaders.slice(3).map((l) => (
                <li key={l.sub}>
                  <RankRow leader={l} youLabel={youLabel} />
                </li>
              ))}
            </ol>
          ) : null}

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
