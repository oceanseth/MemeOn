import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/atoms/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { MemeCard } from '@/molecules/meme-card'
import { Tabs, TabsList, TabsTrigger } from '@/atoms/tabs'
import { binderCardSlotClasses, binderGridClasses } from '../lib/binderChrome'
import type { ProfileShelfModel } from '../hooks/useProfileScreen'

const TABS = 'mb-4.5 max-sm:*:*:flex-1'

/** Created/Binder tabs plus the empty state or card grid both profile surfaces share. */
export function ProfileShelf({
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
}: ProfileShelfModel) {
  return (
    <div data-slot="profile-shelf">
      <div className={TABS}>
        <Tabs {...tabsProps}>
          <TabsList variant="pills" aria-label={tabsListLabel}>
            <TabsTrigger value="created" aria-controls={gridProps.id}>
              {createdTabLabel}
            </TabsTrigger>
            <TabsTrigger value="binder" aria-controls={gridProps.id}>
              {binderTabLabel}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showEmpty ? (
        <Empty {...gridProps}>
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyBody}</EmptyDescription>
          </EmptyHeader>
          {showEmptyLink && (
            <EmptyContent>
              <Link className={buttonVariants({ variant: 'primary' })} {...emptyLinkProps}>
                {emptyLinkLabel}
              </Link>
            </EmptyContent>
          )}
        </Empty>
      ) : showGrid ? (
        <>
          <ul className={binderGridClasses} {...gridProps}>
            {cards.map((card) => (
              <li key={card.id} className={binderCardSlotClasses}>
                <MemeCard
                  model={card.memeCard}
                  /* one footer row: shares count on the right */
                  footerRight={
                    card.sharesLabel !== null ? (
                      <span className="font-semibold text-foreground">{card.sharesLabel}</span>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
          {showMore && (
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <Button className="max-sm:w-full" {...showMoreButtonProps}>
                {showMoreLabel}
              </Button>
              <p className="m-0 text-xs text-muted-foreground">{gridCountLabel}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
