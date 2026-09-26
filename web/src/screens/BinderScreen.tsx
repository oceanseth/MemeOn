import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { Badge } from '@/atoms/badge'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Checkbox } from '@/atoms/checkbox'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { Heading } from '@/atoms/heading'
import { MasonryGrid, MasonrySkeletonGrid } from '@/organisms/masonry-grid'
import { MemeCard } from '@/molecules/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Progress } from '@/atoms/progress'
import { Toolbar } from '@/atoms/toolbar'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { cn } from '../lib/cn'
import { SortChips } from '@/molecules/sort-chips'
import { Icon } from '@/atoms/icon'

/** The creator/private row under a binder card. One fixed 24px line — masonry card heights are
 *  arithmetic (`useBinderScreen` counts this row and the meter into its chrome constant). */
const binderCardFooterClasses = cn(
  'mt-0.5 flex h-6 items-center justify-between gap-2 overflow-hidden text-xs font-medium text-foreground',
)

/* reward rail lives in AppShell QuestBar — claim is a one-shot shell mutation, not duplicated here */

/** Own binder as a function of its model. Every engine state is one set of args. */
export function BinderScreen({
  pageTitle,
  intro,
  identity,
  statusProps,
  statusMessage,
  collectionHeading,
  toolbarAriaLabel,
  showPrivateToggle,
  privateToggleLabel,
  privateToggleProps,
  sortChips,
  createLinkProps,
  createLabel,
  cards,
  masonry,
  showMore,
  showLoading,
  showEmpty,
  emptyMessage,
  emptyAction,
  showError,
  errorTitle,
  errorMessage,
  retryLabel,
  retryProps,
  showGrid,
}: BinderScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead title={pageTitle} subtitle={intro} />

      {/* identity card — raised surface, not a bare row */}
      {identity && (
        <Card
          size="sm"
          data-slot="binder-identity"
          className="mb-6 flex min-h-24.5 items-center gap-4"
        >
          <Avatar name={identity.name} src={identity.pictureUrl} size="lg" />
          <div className="min-w-0">
            <p
              data-slot="binder-identity-name"
              className="m-0 font-display text-3xl font-normal text-foreground"
            >
              {identity.name}
            </p>
            <p className="m-0 mt-2 text-sm font-medium text-muted-foreground">
              {identity.statsLabel}
            </p>
          </div>
        </Card>
      )}

      <Toolbar align="between" data-slot="binder-toolbar" className="mt-7 mb-4.5 items-end">
        <div className="min-w-0">
          <Heading as="h3">{collectionHeading}</Heading>
          {/* mounted in every state, text swapped: a live region inserted with its content is missed */}
          <span className="mt-1 block text-sm text-muted-foreground" {...statusProps}>
            {statusMessage}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 max-xl:w-full"
          role="group"
          aria-label={toolbarAriaLabel}
        >
          {/* toolbar order: private filter → sort → Mint */}
          {showPrivateToggle && (
            <Checkbox label={privateToggleLabel} variant="pill" {...privateToggleProps} />
          )}
          <SortChips model={sortChips} />
          {/* Mint is bubblegum under the shell cut and neutral once the header owns primary */}
          <Link
            className={cn(buttonVariants({ variant: 'mint' }), 'max-xl:w-full')}
            {...createLinkProps}
          >
            <span className="xl:hidden" aria-hidden="true">
              <Icon name="circle-plus" size={16} />
            </span>
            {createLabel}
          </Link>
        </div>
      </Toolbar>

      {showLoading ? (
        <MasonrySkeletonGrid model={masonry} />
      ) : showError ? (
        <Empty variant="error">
          <EmptyHeader>
            <EmptyTitle render={<h2 />}>{errorTitle}</EmptyTitle>
            <EmptyDescription>{errorMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...retryProps}>
              {retryLabel}
            </Button>
          </EmptyContent>
        </Empty>
      ) : showEmpty ? (
        // the persistent status label above is the one live region for this screen
        <Empty role="none">
          <EmptyDescription>{emptyMessage}</EmptyDescription>
          {emptyAction && (
            <EmptyContent>
              {emptyAction.kind === 'create' ? (
                /* `create` is only ever the first-run mint (`useBinderScreen`: the other kind is
                   showPrivate), so the plus belongs to this branch and not to the label */
                <Link className={buttonVariants({ variant: 'primary' })} {...emptyAction.linkProps}>
                  <span aria-hidden="true">
                    <Icon name="circle-plus" size={16} />
                  </span>
                  {emptyAction.label}
                </Link>
              ) : (
                <Button variant="primary" onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </Button>
              )}
            </EmptyContent>
          )}
        </Empty>
      ) : showGrid ? (
        <MasonryGrid
          model={masonry}
          items={cards.map((card) => ({
            ariaLabel: card.ariaLabel,
            node: (
              <MemeCard
                model={card.memeCard}
                /* the meta row's right lane: shares count in place of the listing badge */
                footerRight={
                  <span className="font-semibold text-foreground">{card.sharesLabel}</span>
                }
                footer={
                  <>
                    <span data-slot="binder-card-note" className={binderCardFooterClasses}>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                        {card.showCreator && <span>{card.mintedLabel}</span>}
                        {card.showPrivate && (
                          <Badge>
                            <span aria-hidden="true">
                              <Icon name="eye-off" size={14} />
                            </span>{' '}
                            {card.privateLabel}
                          </Badge>
                        )}
                      </span>
                    </span>
                    {/* the ownership groove: how much of this meme the binder holds. `mt-auto` pins it
                       to the card's bottom edge, so rounding slack sits above the meter, not under it. */}
                    <div data-slot="binder-meter" className="mt-auto pt-1">
                      <Progress value={card.sharesPct} variant="braincell" aria-hidden="true" />
                    </div>
                  </>
                }
              />
            ),
          }))}
        />
      ) : null}

      {showMore && (
        <div className="mt-7 flex justify-center">
          <Button onClick={showMore.onClick} className="max-sm:w-full">
            {showMore.label}
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
