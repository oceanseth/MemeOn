import { Link } from 'react-router-dom'
import { Badge } from '../atoms/Badge'
import { Button, buttonClasses } from '../atoms/Button'
import { Checkbox } from '../atoms/Checkbox'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { MemeCard } from '../atoms/MemeCard'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { SkeletonCard } from '../atoms/Skeleton'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { SortChips } from '../molecules/SortChips'

/** Skeleton tiles hold the grid geometry while the binder loads, so nothing jumps on arrival. */
const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

const cardGrid = 'grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 max-sm:grid-cols-2 max-sm:gap-3'

/** Own binder as a function of its model. Every engine state is one set of args. */
export function BinderScreen({
  statusProps,
  statusMessage,
  showPrivateToggle,
  privateCount,
  privateToggleProps,
  sortChips,
  createLinkProps,
  cards,
  showLoading,
  showEmpty,
  emptyMessage,
  emptyAction,
  showError,
  errorTitle,
  errorMessage,
  retryProps,
  showGrid,
}: BinderScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead title="My Binder">
        <FilterBar>
          {/* mounted in every state, text swapped: a live region inserted with its content is missed */}
          <span className="text-sm text-text-dim tabular-nums" {...statusProps}>
            {statusMessage}
          </span>
          <Link className={buttonClasses('primary')} {...createLinkProps}>
            ＋ Create meme
          </Link>
        </FilterBar>
      </PageHead>

      <div className="mb-[18px] flex flex-wrap items-center gap-2.5" role="group" aria-label="Sort and filter your binder">
        <SortChips model={sortChips} />
        {showPrivateToggle && (
          <Checkbox label={`Show private (${privateCount})`} {...privateToggleProps} />
        )}
      </div>

      {showLoading ? (
        <ul className={cardGrid} aria-hidden="true">
          {SKELETON_KEYS.map((key) => (
            <li key={key}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : showError ? (
        <EmptyState error>
          <p>
            <strong>{errorTitle}</strong>
          </p>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...retryProps}>
              Try again
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        // the persistent status label above is the one live region for this screen
        <EmptyState role="none">
          <p>{emptyMessage}</p>
          {emptyAction && (
            <EmptyActions>
              {emptyAction.kind === 'create' ? (
                <Link className={buttonClasses('primary')} {...emptyAction.linkProps}>
                  {emptyAction.label}
                </Link>
              ) : (
                <Button variant="primary" onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </Button>
              )}
            </EmptyActions>
          )}
        </EmptyState>
      ) : showGrid ? (
        <ul className={cardGrid}>
          {cards.map((card) => (
            <li key={card.id} className="card-slot" aria-label={card.ariaLabel}>
              <MemeCard
                model={card.memeCard}
                footer={
                  <>
                    <span className="meme-sub">
                      <span className="text-sm font-semibold text-gold tabular-nums">{card.sharesLabel}</span>
                      <span className="flex flex-wrap items-center justify-end gap-1.5">
                        {card.showCreator && <span>you minted this</span>}
                        {card.showPrivate && <Badge>🙈 private</Badge>}
                      </span>
                    </span>
                    <span className="block h-1 overflow-hidden rounded-sm bg-bg-raised" aria-hidden="true">
                      <i className="block h-full bg-gold" style={{ width: `${card.sharesPct}%` }} />
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </PageContainer>
  )
}
