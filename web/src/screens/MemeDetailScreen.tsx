import { Link } from 'react-router-dom'
import { Badge } from '../atoms/Badge'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState, Muted } from '../atoms/EmptyState'
import { Field, FieldLabel, Hint } from '../atoms/Field'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { MemeplexPanel } from '../organisms/MemeplexPanel'

/** UA paragraph rhythm, which preflight resets: the column reads as prose, not as a stack. */
const prose = 'leading-[1.55] [margin-block:1em]'

/** The people row: the sources list and the cap table are the same shape. */
const personRow = cn(
  'flex flex-wrap items-center gap-3 gap-y-2 rounded-[12px] border border-border bg-bg-raised p-3',
  '[&>*]:min-w-0',
)

/** A stack of rows, evenly spaced. */
const rowList = 'mt-2.5 flex flex-col gap-2.5'

/** the caption under a panel title */
const panelCaption = 'mt-1.5 mb-2.5 text-[13.5px] leading-[1.55] text-text-dim'

/** Meme detail as a function of its engine-provided model. */
export function MemeDetailScreen({ showNotFound, showLoading, notFound, loadingLabel, detail }: MemeDetailScreenModel) {
  if (showNotFound) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <EmptyState className="mt-[60px]">
        <p>{notFound.message}</p>
        <EmptyActions><Link className={buttonClasses()} {...notFound.linkProps}>{notFound.linkLabel}</Link></EmptyActions>
      </EmptyState>
    </PageContainer>
  )
  if (showLoading || !detail) return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* a labelled spinner row, never a bare spinner */}
      <div
        data-slot="loading-state"
        className="flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-text-dim"
        role="status"
      >
        <Spinner />{loadingLabel}
      </div>
    </PageContainer>
  )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* stacks ~140px before the rail would drop under the card's own width */}
      <div className="mt-7 grid grid-cols-[minmax(280px,420px)_1fr] gap-7 max-2xl:grid-cols-1">
        <div className="self-start">
          {/* the hero is the same MemeCard atom every grid thumb renders, at size="lg"; only its
             ≤900 cap, applied to a wrapper since the atom exposes no className, is ours */}
          <div className="max-2xl:mx-auto max-2xl:w-full max-2xl:max-w-[480px]">
            <MemeCard model={detail.card} size="lg" />
          </div>
          {/* the tier meter, in the card's own foil colour (currentColor from the inline tint) */}
          <div className="mt-3" style={{ color: detail.tierColor }}>
            <div className="h-1.5 overflow-hidden rounded-pill bg-bg-raised" {...detail.tierLadder.meterProps}>
              <div className="h-full rounded-pill bg-current" style={detail.tierLadder.fillStyle} />
            </div>
            <p className="mt-1.5 mb-0 text-sm text-text-dim">{detail.tierLadder.nextLabel}</p>
          </div>
        </div>
        <div>
          <h2 className="mt-0 mb-2 text-xl font-bold">{detail.title}{detail.private && <Badge className="ml-2.5 align-middle">🙈 private</Badge>}</h2>
          <p className={cn(prose, 'text-text-dim')}>
            minted by <Link className="text-accent no-underline" {...detail.creatorLinkProps}>{detail.creatorName}</Link> · owned by <Link className="text-accent no-underline" {...detail.ownerLinkProps}>{detail.ownerName}</Link>
            {detail.tagsLabel && <> · {detail.tagsLabel}</>}
            {detail.remixLinkProps && <> · <Link className="text-accent no-underline" {...detail.remixLinkProps}>🧬 remix</Link></>}
            {detail.sourceLinkProps && <> · <a className="text-accent no-underline" {...detail.sourceLinkProps}>{detail.sourceLabel}</a></>}
          </p>
          <p className={cn(prose, 'text-[18px]')}>👁️ <strong>{detail.viewsLabel}</strong> {detail.viewsWord} · 🔁 <strong>{detail.resharesLabel}</strong> {detail.resharesWord} · 🧠 <strong>{detail.valueLabel}</strong> card value{detail.holdingsLabel && <> · you hold <strong>{detail.holdingsLabel}</strong></>}</p>
          <p className={cn(prose, 'text-sm text-text-dim')}>{detail.tierHype}</p>
          {detail.signedOut && <Panel className="mb-4">
            <h3>{detail.signedOut.title}</h3>
            <p className={panelCaption}>{detail.signedOut.body}</p>
            <FilterBar>
              <Button variant="primary" {...detail.signedOut.loginButtonProps}>{detail.signedOut.loginLabel}</Button>
              <Link className={buttonClasses()} {...detail.signedOut.browseLinkProps}>{detail.signedOut.browseLabel}</Link>
            </FilterBar>
            {detail.signedOut.error && <Notice tone="error" {...detail.signedOut.errorProps}>{detail.signedOut.error}</Notice>}
          </Panel>}
          <Panel className="mb-4">
            <h3>Share to go viral</h3><p className={panelCaption}>Every load of this link counts a view (views drive the tier ladder); each new place it's shared — a subreddit, a group chat, an unfurl — counts a reshare.</p>
            <FilterBar><Input className="min-w-[200px] flex-1" {...detail.shareInputProps} /><Button variant="primary" {...detail.copyButtonProps}>{detail.copyButtonLabel}</Button><a className={buttonClasses()} {...detail.previewLinkProps}>Preview card</a></FilterBar>
          </Panel>
          {detail.actions.length > 0 && <FilterBar className="mb-4">{detail.actions.map((action) => <Button key={action.label} variant={action.variant} {...action.buttonProps}>{action.label}</Button>)}</FilterBar>}
          <div {...detail.noticeProps}>{detail.notice && <Notice tone="ok" role="none">{detail.notice}</Notice>}</div>
          <div {...detail.errorProps}>{detail.error && <Notice tone="error" role="none">{detail.error}</Notice>}</div>
          {detail.listing ? <Panel className="mb-4">
            <h3>{detail.listing.saleLabel}</h3>
            {detail.listing.showBuy && <>
              <FilterBar className="mt-2.5">
                <Field><FieldLabel>{detail.listing.buyLabel}</FieldLabel><Input type="number" className="w-[90px]" {...detail.listing.buyInputProps} /></Field>
                <Button variant="primary" {...detail.listing.buyButtonProps}>{detail.listing.buyButtonLabel}</Button>
                {detail.listing.balanceLabel && <Muted className="text-[13px]">{detail.listing.balanceLabel}</Muted>}
              </FilterBar>
              {detail.listing.disabledReason && <Hint>{detail.listing.disabledReason}</Hint>}
            </>}
            {detail.listing.showUnlist && <FilterBar className="mt-2.5"><Button variant="danger" {...detail.listing.unlistButtonProps}>{detail.listing.unlistButtonLabel}</Button></FilterBar>}
          </Panel> : detail.list.show ? <Panel className="mb-4">
            <h3>List shares for sale</h3><FilterBar className="mt-2.5">
              <Field><FieldLabel>shares</FieldLabel><Input type="number" className="w-[80px]" {...detail.list.sharesInputProps} /></Field>
              <Field><FieldLabel><span aria-hidden="true">🧠/share</span><span className="sr-only">braincells per share</span></FieldLabel><Input type="number" className="w-[90px]" {...detail.list.priceInputProps} /></Field>
              <Button variant="primary" {...detail.list.listButtonProps}>{detail.list.listButtonLabel}</Button>
            </FilterBar>
            {detail.list.disabledReason && <Hint>{detail.list.disabledReason}</Hint>}
          </Panel> : null}
          {detail.sources.length > 0 && <Panel className="mb-4"><h3>📡 Where it's spreading</h3><div className={rowList}>{detail.sources.map((source) => <div key={source.id} className={cn(personRow, 'p-[9px]')}><span className="text-[13.5px]">{source.linkProps ? <a className="text-accent no-underline" {...source.linkProps}>{source.label}</a> : source.label}</span><span className="flex-1" /><Muted className="text-[13px]">👁️ {source.viewsLabel}</Muted></div>)}</div></Panel>}
          <MemeplexPanel model={detail.plex} />
          <Panel className="mt-4"><h3>{detail.capTableTitle}</h3><div className={rowList}>{detail.capTable.map((holder) => <div key={holder.userId} className={cn(personRow, 'tabular-nums')}><span className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap">{holder.label}</span><span className="flex-1" /><span>{holder.sharesLabel}</span></div>)}</div></Panel>
        </div>
      </div>
      <ConfirmDialog model={detail.deleteDialog} />
      <ConfirmDialog model={detail.buyDialog} />
      <ConfirmDialog model={detail.claimDialog} />
    </PageContainer>
  )
}
