import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Badge } from '@/atoms/badge'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardTitle } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { Field, FieldLabel, Hint } from '@/atoms/field'
import { Heading } from '@/atoms/heading'
import { InlineLink } from '@/atoms/inline-link'
import { Input } from '@/atoms/input'
import { MemeCard } from '@/atoms/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Progress } from '@/atoms/progress'
import { Skeleton } from '@/atoms/skeleton'
import { Spinner } from '@/atoms/spinner'
import { cn } from '../lib/cn'
import type { DetailTierLadderModel, MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '@/molecules/confirm-dialog'
import { MemeplexPanel } from '@/organisms/memeplex-panel'
import { Icon } from '@/atoms/icon'

const PAGE_INTRO = 'A tiny piece of the internet. See who’s holding it.'
const SHARE_CAPTION = 'Every load counts a view; every new place it travels counts as a reshare.'

/**
 * Hero 410 · gap 30 · rail 668 — exactly the 1108 column the shell gives `<main>` at 1440. The
 * pair only splits once the window can afford both (≥1100); below that the rail would be narrower
 * than the card it sits beside, so the page is one column.
 */
const detailGrid = cn(
  'grid grid-cols-1 gap-4.5',
  '2xl:grid-cols-[minmax(0,410px)_minmax(0,1fr)] 2xl:gap-8',
)

const rail = 'flex min-w-0 flex-col gap-4.5'

/* one DOM order for both layouts: stacked = title → hero → rail; split = hero left, meta top-right */
const heroPlacement = '2xl:col-start-1 2xl:row-start-1 2xl:row-span-2'
const metaPlacement = '2xl:col-start-2 2xl:row-start-1'
const railPlacement = '2xl:col-start-2 2xl:row-start-2'

/** The caption under a panel heading: 13/16 on ink-muted. */
const caption = 'mt-1.5 mb-0 text-sm text-muted-foreground'

const panelRow = 'mt-4 flex flex-wrap items-center gap-2.5'

/** The sources / cap-table row: a shallow well, not a bordered box. */
const personRow = cn(
  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted px-3.5 py-2.5',
  'text-sm text-foreground *:min-w-0',
)

const rowList = 'mt-3 flex flex-col gap-2'

/** Tier line: success colour signed in, link colour on public card — one element, one swap. */
const heroTierLine = 'm-0 text-sm font-semibold'

/** Where this card sits on the rarity ladder, and the tier's own line of hype under it. */
function TierLadder({ model, hype }: { model: DetailTierLadderModel; hype: string }) {
  return (
    /* +12px top margin: MemeCard footer already gaps 6px; design wants 18 before the meter */
    <div data-slot="tier-progression" className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-semibold text-success-foreground">{model.currentLabel}</span>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">{model.nextLabel}</span>
      </div>
      <Progress className="mt-2" value={model.value} variant="ladder" {...model.meterProps} />
      <p className={caption}>{hype}</p>
    </div>
  )
}

/** Meme detail as a function of its engine-provided model. */
export function MemeDetailScreen({ showNotFound, showLoading, notFound, loadingLabel, detail }: MemeDetailScreenModel) {
  if (showNotFound) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <Empty className="mt-15">
        <EmptyHeader>
          <EmptyTitle render={<h2 />}>This card was pulled</EmptyTitle>
          <EmptyDescription>{notFound.message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link className={buttonVariants()} {...notFound.linkProps}>{notFound.linkLabel}</Link>
        </EmptyContent>
      </Empty>
    </PageContainer>
  )
  if (showLoading || !detail) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* a labelled spinner row, never a bare spinner, over the shape the page is about to take */}
      <div
        data-slot="loading-state"
        className="flex items-center justify-center gap-2.5 px-5 py-10 text-sm text-muted-foreground"
        role="status"
      >
        <Spinner />{loadingLabel}
      </div>
      <div aria-hidden="true" className={detailGrid}>
        <Skeleton className="aspect-square" />
        <div className={rail}>
          <Skeleton className="h-22" />
          <Skeleton className="h-41.5" />
          <Skeleton className="h-60" />
        </div>
      </div>
    </PageContainer>
  )

  /* share-link arrival: no session — meme name is the H1, no PageHead */
  const isPublic = !!detail.signedOut
  const privateBadge = detail.private ? <Badge variant="info">
      <span aria-hidden="true">
        <Icon name="eye-off" size={14} />
      </span>{' '}
      private
    </Badge> : null

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {!isPublic && (
        <PageHead level="h1" title={detail.title} subtitle={PAGE_INTRO} className="mb-3.5">
          {privateBadge}
        </PageHead>
      )}
      <div className={detailGrid}>
        <div data-slot="detail-metadata" className={cn('flex min-w-0 flex-col', metaPlacement)}>
          {isPublic && (
            <Heading as="h1" size="display" className="wrap-anywhere">
              {/* the gap between the name and its seal is the row's, not the heading's */}
              <span className="flex flex-wrap items-center gap-x-3">{detail.title}{privateBadge}</span>
            </Heading>
          )}
          <p className={cn('mb-0 text-base font-medium text-muted-foreground', isPublic ? 'mt-2.5' : 'mt-0')}>
            minted by <InlineLink render={<Link {...detail.creatorLinkProps} />}>{detail.creatorName}</InlineLink>
            {' · '}owned by <InlineLink render={<Link {...detail.ownerLinkProps} />}>{detail.ownerName}</InlineLink>
            {detail.tagsLabel && <> · {detail.tagsLabel}</>}
            {detail.remixLinkProps && <> · <InlineLink render={<Link {...detail.remixLinkProps} />}>
              <span aria-hidden="true">
                <Icon name="dna" size={14} />
              </span>{' '}
              remix
            </InlineLink></>}
            {detail.sourceLinkProps && <> · <InlineLink {...detail.sourceLinkProps}>{detail.sourceLabel}</InlineLink></>}
          </p>
          <p className="mt-4 mb-0 text-lg font-medium text-foreground tabular-nums">
            <span className="inline-flex items-center gap-0.5">
              <span aria-hidden="true">
                <Icon name="eye" size={16} />
              </span>{' '}
              {detail.viewsLabel} {detail.viewsWord}
            </span>
            <span className="inline-flex items-center gap-0.5">
              · <span aria-hidden="true">
                <Icon name="arrows-left-right" size={16} />
              </span>{' '}
              {detail.resharesLabel} {detail.resharesWord}
            </span>
            <span className="inline-flex items-center gap-0.5">
              · <span aria-hidden="true">
                <Icon name="brain" size={16} />
              </span>{' '}
              {detail.valueLabel} card value
            </span>
            {detail.holdingsLabel && <> · you hold {detail.holdingsLabel}</>}
          </p>
          {/* the page's two live regions: inside this ungapped column an empty one costs nothing,
             so the rail keeps its 18px rhythm whether a message is showing or not */}
          <div {...detail.noticeProps}>{detail.notice && <Alert variant="success" role="none" className="mt-3">{detail.notice}</Alert>}</div>
          <div {...detail.errorProps}>{detail.error && <Alert variant="error" role="none" className="mt-3">{detail.error}</Alert>}</div>
        </div>

        <div data-slot="detail-hero" className={cn('self-start', heroPlacement)}>
          {/* MemeCard lg with tier line + meter in footer so they sit inside the card padding */}
          <MemeCard
            model={detail.card}
            size="lg"
            subTitle={
              <p
                data-slot="detail-tier-line"
                className={cn(heroTierLine, isPublic ? 'text-link' : 'text-success-foreground')}
              >
                {detail.tierLine}
              </p>
            }
            footer={<TierLadder model={detail.tierLadder} hype={detail.tierHype} />}
          />
        </div>

        <div data-slot="detail-rail" className={cn(rail, railPlacement)}>
          {detail.signedOut && (
            <Card>
              <CardTitle size="card-title">{detail.signedOut.title}</CardTitle>
              <p className={caption}>{detail.signedOut.body}</p>
              <div className={panelRow}>
                {/* the single bubblegum on a public card */}
                <Button variant="primary" className="max-sm:w-full" {...detail.signedOut.loginButtonProps}>
                  {detail.signedOut.loginLabel}
                </Button>
                <Link className={cn(buttonVariants(), 'max-sm:w-full')} {...detail.signedOut.browseLinkProps}>
                  {detail.signedOut.browseLabel}
                </Link>
              </div>
              {detail.signedOut.error && (
                <Alert variant="error" className="mt-3" {...detail.signedOut.errorProps}>{detail.signedOut.error}</Alert>
              )}
            </Card>
          )}

          <Card>
            <CardTitle size="title" render={<h2 />}>Share to go viral</CardTitle>
            <p className={caption}>{SHARE_CAPTION}</p>
            <div className={panelRow}>
              <Input className="min-w-50 flex-1 max-sm:w-full max-sm:flex-none" {...detail.shareInputProps} />
              {/* the ultraviolet companion: the card's one bubblegum belongs to the buy control */}
              <Button variant="brand" className="max-sm:flex-1" {...detail.copyButtonProps}>
                {detail.copyButtonLabel}
              </Button>
              <a className={cn(buttonVariants(), 'max-sm:flex-1')} {...detail.previewLinkProps}>Preview card</a>
            </div>
          </Card>


          {detail.listing && !detail.signedOut ? (
            <Card>
              <CardTitle size="card-title">{detail.listing.saleLabel}</CardTitle>
              {detail.listing.showBuy && detail.listing.balanceLabel && (
                <p className={caption}>{detail.listing.balanceLabel}</p>
              )}
              {detail.listing.showBuy && <>
                <div className={cn(panelRow, 'items-end')}>
                  <Field>
                    <FieldLabel>{detail.listing.buyLabel}</FieldLabel>
                    <Input type="number" className="w-23" {...detail.listing.buyInputProps} />
                  </Field>
                  <Button variant="primary" {...detail.listing.buyButtonProps}>{detail.listing.buyButtonLabel}</Button>
                </div>
                {detail.listing.disabledReason && <Hint>{detail.listing.disabledReason}</Hint>}
              </>}
              {detail.listing.showUnlist && (
                <div className={panelRow}>
                  <Button {...detail.listing.unlistButtonProps}>{detail.listing.unlistButtonLabel}</Button>
                </div>
              )}
            </Card>
          ) : detail.list.show ? (
            <Card>
              <CardTitle render={<h3 />} className="mb-1.5">List shares for sale</CardTitle>
              <p className={caption}>Name your price — anyone in the market can pick up a slice of the joke.</p>
              <div className={cn(panelRow, 'items-end')}>
                <Field>
                  <FieldLabel>shares</FieldLabel>
                  <Input type="number" className="w-23" {...detail.list.sharesInputProps} />
                </Field>
                <Field>
                  <FieldLabel>
                    <span className="inline-flex items-center gap-0.5">
                      <span aria-hidden="true">
                        <Icon name="brain" size={14} />
                      </span>{' '}
                      <span aria-hidden="true">/share</span>
                    </span>
                    <span className="sr-only">braincells per share</span>
                  </FieldLabel>
                  <Input type="number" className="w-25" {...detail.list.priceInputProps} />
                </Field>
                <Button variant="primary" {...detail.list.listButtonProps}>{detail.list.listButtonLabel}</Button>
              </div>
              {detail.list.disabledReason && <Hint>{detail.list.disabledReason}</Hint>}
            </Card>
          ) : null}

          {detail.actions.length > 0 && (
            <Card>
              <CardTitle render={<h3 />} className="mb-1.5">Card controls</CardTitle>
              <p className={caption}>What you hold decides what you can do with this card.</p>
              <div className={panelRow}>
                {detail.actions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={cn(action.variant === 'destructive' && 'ml-auto')}
                    {...action.buttonProps}
                  >
                    <span aria-hidden="true">
                      <Icon name={action.icon} size={16} />
                    </span>{' '}
                    {action.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* spread sources and cap table side by side under the market card */}
          <div
            data-slot="detail-spread"
            className="flex flex-wrap items-start gap-4.5 *:min-w-70 *:flex-1 [&>[data-slot=card]]:mt-0"
          >
            {detail.sources.length > 0 && (
              <Card>
                <CardTitle render={<h3 />} className="mb-1.5">
                  <span aria-hidden="true">
                    <Icon name="satellite" size={16} />
                  </span>{' '}
                  Where it’s spreading
                </CardTitle>
                <div className={rowList}>
                  {detail.sources.map((source) => (
                    <div key={source.id} className={personRow}>
                      <span className="truncate">
                        {source.linkProps
                          ? <InlineLink {...source.linkProps}>{source.label}</InlineLink>
                          : source.label}
                      </span>
                      <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-muted-foreground tabular-nums">
                      <span aria-hidden="true">
                        <Icon name="eye" size={14} />
                      </span>{' '}
                      {source.viewsLabel}
                    </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <MemeplexPanel model={detail.plex} />
          </div>

          <Card>
            <CardTitle render={<h3 />} className="mb-1.5">{detail.capTableTitle}</CardTitle>
            <div className={rowList}>
              {detail.capTable.map((holder) => (
                <div key={holder.userId} className={cn(personRow, 'tabular-nums')}>
                  <span className="truncate font-semibold">{holder.label}</span>
                  <span className="ml-auto shrink-0">{holder.sharesLabel}</span>
                </div>
              ))}
            </div>
            {detail.capTableNote && <p className={caption}>{detail.capTableNote}</p>}
          </Card>
        </div>
      </div>
      <ConfirmDialog model={detail.deleteDialog} />
      <ConfirmDialog model={detail.buyDialog} />
      <ConfirmDialog model={detail.claimDialog} />
    </PageContainer>
  )
}
