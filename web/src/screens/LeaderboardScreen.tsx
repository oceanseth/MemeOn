import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { Badge } from '@/atoms/badge'
import { Button } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription } from '@/atoms/empty'
import { Heading } from '@/atoms/heading'
import { Item, ItemTitle } from '@/atoms/item'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { SkeletonRow } from '@/atoms/skeleton'
import { cn } from '../lib/cn'
import type { LeaderboardRowModel, LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'
import { Icon } from '@/atoms/icon'

const skeletonRows = [0, 1, 2, 3, 4]

/** Braincell count colour: bubblegum ramp flips with theme. */
const COUNT = 'font-sans font-semibold text-braincell tabular-nums'

/**
 * Two lists, not one: the podium is inside the panel and the ladder continues beside it. Each row's
 * accessible name already states its rank (`rowLabel` in `useLeaderboardScreen`), so the split
 * cannot make a screen reader think the ranking restarts at four.
 */
const PODIUM_LIST = cn('m-0 flex list-none gap-5 p-0', 'max-md:flex-col max-md:gap-3.5')
const BOARD = 'm-0 flex list-none flex-col gap-5 p-0 max-md:gap-3.5'

/** A podium tile is a column on the desktop and a row on the phone; #1 wears the frame. */
const PODIUM = 'h-full text-center md:w-54.5 md:flex-col md:items-center max-md:text-left'

const RANK_NUMERAL = 'w-7 shrink-0 text-center text-lg font-semibold text-muted-foreground tabular-nums'

/**
 * The podium ornament: one `medal` glyph in the rank's metal, with the rank numeral beside it.
 *
 * The numeral is not decoration. The 🥇🥈🥉 this replaced carried the place *inside* the disc; the
 * glyph does not — it engraves a fixed "1" at every rank (`M12 18v-2h-.5` in `atoms/icon.tsx`), so
 * the pip reads as an engraving and never as a place. Gold and bronze are then one silhouette at
 * one size with nothing but hue between them, which is a thin thread to hang third place on and no
 * thread at all in a monochrome print or a red-green eye. The numeral puts the place back on shape.
 *
 * The metal goes on the wrapper rather than on `Icon`: the glyph strokes in `currentColor`, so one
 * class tints medal and numeral together and both class names stay literal for the linter.
 * `linkLabel` already announces "Rank 2 …", so the whole cluster stays `aria-hidden` — this is a
 * visual restatement of something already spoken, not a second voice.
 */
const PODIUM_MEDAL = 'inline-flex items-center gap-0.5 leading-none'
const PODIUM_RANK = 'text-lg font-semibold tabular-nums max-md:text-base'

function RankRow({ leader, youLabel }: { leader: LeaderboardRowModel; youLabel: string }) {
  return (
    <Item
      render={<Link {...leader.profileLinkProps} />}
      aria-label={leader.linkLabel}
      data-slot="person-row"
      variant="raised"
      size="row"
      frame={leader.isMe ? 'brand' : 'none'}
    >
      <span className={RANK_NUMERAL}>{leader.rankNumeral}</span>
      <Avatar name={leader.name} src={leader.avatarSrc} size="rank" loading="lazy" />
      <ItemTitle size="lg" truncate className="min-w-0 flex-1">
        {leader.name}
      </ItemTitle>
      {leader.isMe ? (
        <Badge variant="info" className="shrink-0">
          {youLabel}
        </Badge>
      ) : null}
      <span className={cn(COUNT, 'shrink-0 text-base whitespace-nowrap')}>
        <span className="inline-flex items-center gap-0.5">
          <span aria-hidden="true">
            <Icon name="brain" size={15} />
          </span>{' '}
          {leader.braincellsLabel}
        </span>
      </span>
    </Item>
  )
}

/** The ranked board as a function of its model. Every engine state is one set of args. */
export function LeaderboardScreen({
  pageTitle,
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
      <PageHead
        level="h1"
        title={
          <span className="inline-flex items-center gap-2">
            <Icon name="trophy" size={22} /> {pageTitle}
          </span>
        }
        subtitle={subtitle}
        className="mb-5"
      />

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

      {showEmpty ? (
        <Empty>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </Empty>
      ) : null}

      {showError ? (
        <Empty variant="error">
          <EmptyDescription>{errorMessage}</EmptyDescription>
          <EmptyContent>
            <Button onClick={retry}>{retryLabel}</Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {showList ? (
        <>
          {/* podium: head + top three; ranks 4+ continue in the list below */}
          <Card
            size="sm"
            data-slot="podium"
            className="mb-5 flex items-center gap-10 max-md:flex-col max-md:items-stretch max-md:gap-5"
          >
            <div className="max-w-75 flex-1" data-slot="podium-head">
              <Heading as="h2" size="section">
                {podiumTitle}
              </Heading>
              <p className="m-0 mt-1.5 text-base text-muted-foreground">{podiumSubtitle}</p>
            </div>

            <ol className={PODIUM_LIST} data-slot="podium-cards" aria-label={podiumTitle}>
              {leaders.slice(0, 3).map((l) => (
                <li key={l.sub}>
                  <Item
                    render={<Link {...l.profileLinkProps} />}
                    aria-label={l.linkLabel}
                    data-slot="person-row"
                    variant="raised"
                    size="row"
                    frame={l.rankNumeral === '1' ? 'primary' : 'none'}
                    className={PODIUM}
                  >
                    {l.medal ? (
                      <span
                        aria-hidden="true"
                        data-slot="podium-medal"
                        className={cn(
                          PODIUM_MEDAL,
                          l.medal === 'gold'
                            ? 'text-podium-gold'
                            : l.medal === 'silver'
                              ? 'text-podium-silver'
                              : 'text-podium-bronze',
                        )}
                      >
                        <Icon name="medal" size={28} />
                        <span className={PODIUM_RANK}>{l.rankNumeral}</span>
                      </span>
                    ) : null}
                    <Avatar name={l.name} src={l.avatarSrc} size="podium" loading="lazy" />
                    <ItemTitle size="lg" truncate className="min-w-0 flex-1 md:w-full md:flex-none md:text-center">
                      {l.name}
                    </ItemTitle>
                    {l.isMe ? (
                      <Badge variant="info" className="shrink-0">
                        {youLabel}
                      </Badge>
                    ) : null}
                    <span className={cn(COUNT, 'text-lg font-semibold max-md:text-base')}>
                      <span className="inline-flex items-center gap-0.5">
                        <span aria-hidden="true">
                          <Icon name="brain" size={16} />
                        </span>{' '}
                        {l.braincellsLabel}
                      </span>
                    </span>
                  </Item>
                </li>
              ))}
            </ol>
          </Card>

          {/* ranks 4+: each row's accessible name already carries its rank */}
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
              <Button variant="brand" className="w-55 max-sm:w-full" {...showMoreButtonProps}>
                {showMoreLabel}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageContainer>
  )
}
