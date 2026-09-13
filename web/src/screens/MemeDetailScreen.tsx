import { Link } from 'react-router-dom'
import { Badge } from '../atoms/Badge'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Field, FieldLabel, Hint } from '../atoms/Field'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Skeleton } from '../atoms/Skeleton'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DetailTierLadderModel, MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { MemeplexPanel } from '../organisms/MemeplexPanel'

const PAGE_INTRO = 'A tiny piece of the internet. See who’s holding it.'
const SHARE_CAPTION = 'Every load counts a view; every new place it travels counts as a reshare.'

/**
 * Hero 410 · gap 30 · rail 668 — exactly the 1108 column the shell gives `<main>` at 1440. The
 * pair only splits once the window can afford both (≥1100); below that the rail would be narrower
 * than the card it sits beside, so the page is one column.
 */
const detailGrid = cn(
  'grid grid-cols-1 gap-gutter',
  '4xl:grid-cols-[minmax(0,410px)_minmax(0,1fr)] 4xl:gap-7.5',
)

const rail = 'flex min-w-0 flex-col gap-gutter'

/* one DOM order for both layouts: stacked = title → hero → rail; split = hero left, meta top-right */
const heroPlacement = '4xl:col-start-1 4xl:row-start-1 4xl:row-span-2'
const metaPlacement = '4xl:col-start-2 4xl:row-start-1'
const railPlacement = '4xl:col-start-2 4xl:row-start-2'

/** The caption under a panel heading: 13/16 on ink-muted. */
const caption = 'mt-1.5 mb-0 text-caption text-ink-muted'

const panelRow = 'mt-4 flex flex-wrap items-center gap-2.5'

/** The sources / cap-table row: a shallow well, not a bordered box. */
const personRow = cn(
  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field bg-surface-pressed px-3.5 py-2.5',
  'text-small text-ink [&>*]:min-w-0',
)

const rowList = 'mt-3 flex flex-col gap-2'

const inlineLink = 'text-link underline underline-offset-[3px] decoration-1'

/** Tier line: success colour signed in, link colour on public card — one element, one swap. */
const heroTierLine = 'm-0 text-caption font-bold'

const ladderTrack = 'mt-2 h-2 overflow-hidden rounded-[5px] bg-surface-pressed'
const ladderFill = cn(
  'h-full rounded-[5px]',
  'bg-[linear-gradient(90deg,var(--color-action-secondary),var(--color-action),var(--color-action-secondary))]',
)

/** Where this card sits on the rarity ladder, and the tier's own line of hype under it. */
function TierLadder({ model, hype }: { model: DetailTierLadderModel; hype: string }) {
  return (
    /* +12px top margin: MemeCard footer already gaps 6px; design wants 18 before the meter */
    <div data-slot="tier-progression" className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-caption font-bold text-success-text">{model.currentLabel}</span>
        <span className="text-micro/[15px] font-medium text-ink-muted tabular-nums">{model.nextLabel}</span>
      </div>
      <div className={ladderTrack} {...model.meterProps}>
        <div className={ladderFill} style={model.fillStyle} />
      </div>
      <p className={caption}>{hype}</p>
    </div>
  )
}

/** Meme detail as a function of its engine-provided model. */
export function MemeDetailScreen({ showNotFound, showLoading, notFound, loadingLabel, detail }: MemeDetailScreenModel) {
  if (showNotFound) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <EmptyState className="mt-15">
        <h2>This card was pulled</h2>
        <p>{notFound.message}</p>
        <EmptyActions><Link className={buttonClasses()} {...notFound.linkProps}>{notFound.linkLabel}</Link></EmptyActions>
      </EmptyState>
    </PageContainer>
  )
  if (showLoading || !detail) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* a labelled spinner row, never a bare spinner, over the shape the page is about to take */}
      <div
        data-slot="loading-state"
        className="flex items-center justify-center gap-2.5 px-5 py-10 text-small text-ink-muted"
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
  const privateBadge = detail.private ? <Badge tone="info">🙈 private</Badge> : null

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
            <h1 className="m-0 flex flex-wrap items-center gap-x-3 font-display text-display font-medium tracking-display text-ink max-md:text-display-phone [overflow-wrap:anywhere]">
              {detail.title}{privateBadge}
            </h1>
          )}
          <p className={cn('mb-0 text-label font-medium text-ink-muted', isPublic ? 'mt-2.5' : 'mt-0')}>
            minted by <Link className={inlineLink} {...detail.creatorLinkProps}>{detail.creatorName}</Link>
            {' · '}owned by <Link className={inlineLink} {...detail.ownerLinkProps}>{detail.ownerName}</Link>
            {detail.tagsLabel && <> · {detail.tagsLabel}</>}
            {detail.remixLinkProps && <> · <Link className={inlineLink} {...detail.remixLinkProps}>🧬 remix</Link></>}
            {detail.sourceLinkProps && <> · <a className={inlineLink} {...detail.sourceLinkProps}>{detail.sourceLabel}</a></>}
          </p>
          <p className="mt-4 mb-0 text-intro font-bold text-ink tabular-nums">
            👁️ {detail.viewsLabel} {detail.viewsWord} · 🔁 {detail.resharesLabel} {detail.resharesWord}
            {' · '}🧠 {detail.valueLabel} card value
            {detail.holdingsLabel && <> · you hold {detail.holdingsLabel}</>}
          </p>
          {/* the page's two live regions: inside this ungapped column an empty one costs nothing,
             so the rail keeps its 18px rhythm whether a message is showing or not */}
          <div {...detail.noticeProps}>{detail.notice && <Notice tone="ok" role="none">{detail.notice}</Notice>}</div>
          <div {...detail.errorProps}>{detail.error && <Notice tone="error" role="none">{detail.error}</Notice>}</div>
        </div>

        <div data-slot="detail-hero" className={cn('self-start', heroPlacement)}>
          {/* MemeCard lg with tier line + meter in footer so they sit inside the card padding */}
          <MemeCard
            model={detail.card}
            size="lg"
            footer={<>
              <p
                data-slot="detail-tier-line"
                className={cn(heroTierLine, isPublic ? 'text-link' : 'text-success-text')}
              >
                {detail.tierLine}
              </p>
              <TierLadder model={detail.tierLadder} hype={detail.tierHype} />
            </>}
          />
        </div>

        <div data-slot="detail-rail" className={cn(rail, railPlacement)}>
          {detail.signedOut && (
            <Panel>
              <h2>{detail.signedOut.title}</h2>
              <p className={caption}>{detail.signedOut.body}</p>
              <div className={panelRow}>
                {/* the single bubblegum on a public card */}
                <Button variant="primary" className="max-sm:w-full" {...detail.signedOut.loginButtonProps}>
                  {detail.signedOut.loginLabel}
                </Button>
                <Link className={cn(buttonClasses(), 'max-sm:w-full')} {...detail.signedOut.browseLinkProps}>
                  {detail.signedOut.browseLabel}
                </Link>
              </div>
              {detail.signedOut.error && (
                <Notice tone="error" {...detail.signedOut.errorProps}>{detail.signedOut.error}</Notice>
              )}
            </Panel>
          )}

          <Panel>
            <h2>Share to go viral</h2>
            <p className={caption}>{SHARE_CAPTION}</p>
            <div className={panelRow}>
              <Input className="min-w-50 flex-1 max-sm:w-full max-sm:flex-none" {...detail.shareInputProps} />
              {/* the ultraviolet companion: the card's one bubblegum belongs to the buy control */}
              <Button variant="secondary" className="max-sm:flex-1" {...detail.copyButtonProps}>
                {detail.copyButtonLabel}
              </Button>
              <a className={cn(buttonClasses(), 'max-sm:flex-1')} {...detail.previewLinkProps}>Preview card</a>
            </div>
          </Panel>


          {detail.listing ? (
            <Panel>
              <h2>{detail.listing.saleLabel}</h2>
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
            </Panel>
          ) : detail.list.show ? (
            <Panel>
              <h2>List shares for sale</h2>
              <p className={caption}>Name your price — anyone in the market can pick up a slice of the joke.</p>
              <div className={cn(panelRow, 'items-end')}>
                <Field>
                  <FieldLabel>shares</FieldLabel>
                  <Input type="number" className="w-23" {...detail.list.sharesInputProps} />
                </Field>
                <Field>
                  <FieldLabel>
                    <span aria-hidden="true">🧠/share</span><span className="sr-only">braincells per share</span>
                  </FieldLabel>
                  <Input type="number" className="w-25" {...detail.list.priceInputProps} />
                </Field>
                <Button variant="primary" {...detail.list.listButtonProps}>{detail.list.listButtonLabel}</Button>
              </div>
              {detail.list.disabledReason && <Hint>{detail.list.disabledReason}</Hint>}
            </Panel>
          ) : null}

          {detail.actions.length > 0 && (
            <Panel>
              <h2>Card controls</h2>
              <p className={caption}>What you hold decides what you can do with this card.</p>
              <div className={panelRow}>
                {detail.actions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={cn(action.variant === 'danger' && 'ml-auto')}
                    {...action.buttonProps}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </Panel>
          )}

          {/* spread sources and cap table side by side under the market card */}
          <div
            data-slot="detail-spread"
            className="flex flex-wrap items-start gap-gutter [&>*]:min-w-70 [&>*]:flex-1 [&>[data-slot=panel]]:mt-0"
          >
            {detail.sources.length > 0 && (
              <Panel>
                <h2>📡 Where it’s spreading</h2>
                <div className={rowList}>
                  {detail.sources.map((source) => (
                    <div key={source.id} className={personRow}>
                      <span className="truncate">
                        {source.linkProps
                          ? <a className={inlineLink} {...source.linkProps}>{source.label}</a>
                          : source.label}
                      </span>
                      <span className="ml-auto shrink-0 text-ink-muted tabular-nums">👁️ {source.viewsLabel}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
            <MemeplexPanel model={detail.plex} />
          </div>

          <Panel>
            <h2>{detail.capTableTitle}</h2>
            <div className={rowList}>
              {detail.capTable.map((holder) => (
                <div key={holder.userId} className={cn(personRow, 'tabular-nums')}>
                  <span className="truncate font-semibold">{holder.label}</span>
                  <span className="ml-auto shrink-0">{holder.sharesLabel}</span>
                </div>
              ))}
            </div>
            {detail.capTableNote && <p className={caption}>{detail.capTableNote}</p>}
          </Panel>
        </div>
      </div>
      <ConfirmDialog model={detail.deleteDialog} />
      <ConfirmDialog model={detail.buyDialog} />
      <ConfirmDialog model={detail.claimDialog} />
    </PageContainer>
  )
}
