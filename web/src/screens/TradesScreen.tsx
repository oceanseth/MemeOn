import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Field, FieldHint, FieldLabel } from '../atoms/Field'
import { Fieldset, FieldsetLegend } from '../atoms/Fieldset'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import { SkeletonRow } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { TradeCard } from '../molecules/TradeCard'

const SKELETON_ROWS = ['a', 'b', 'c']
const NO_MEME = '— braincells only, no meme —'

/** A silent region spends none of its column's rhythm until it has something to say. */
const liveRegion = 'empty:sr-only [&:not(:empty)]:mb-4'

/** One well stacked over the next inside a composer column (`LS5-0`: 10px between fields). */
const columnFields = 'flex flex-col gap-2.5'

/**
 * Give and want are one comparison: side by side at 900+ exactly as the board's two 516 columns
 * (`LRW-0`, 28 apart), stacked below it.
 */
const composeGrid = cn(
  'flex flex-col gap-5',
  '2xl:grid 2xl:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:gap-x-7 2xl:gap-y-5',
  '2xl:[&>*:not([data-slot=fieldset])]:col-span-full',
)

/** The composer's section legends are the board's 19/24 800 Onest, not the micro caps. */
const composeLegend = 'mb-2.5 text-[19px]/[24px] font-extrabold tracking-normal text-ink normal-case'

/** A stack of cards, evenly spaced. */
const rowList = 'flex flex-col gap-3.5'

/** Unbounded 23/29 — the section heading each list outside the composer sits under. */
const listHeading = 'm-0 font-display text-title font-medium tracking-title text-ink'

const headingRow = 'mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1'

const countNote = 'text-small text-ink-muted tabular-nums'

const withNoMeme = (options: readonly { id: string; label: string }[]): SelectOption[] => [
  { value: '', label: NO_MEME },
  ...options.map((option) => ({ value: option.id, label: option.label })),
]

/** Trade lists and a controlled compose panel as a function of its model. */
export function TradesScreen({
  newTradeButtonLabel,
  newTradeButtonProps,
  compose,
  open,
  openCountLabel,
  history,
  msg,
  noticeProps,
  err,
  errorNoticeProps,
  showErrorNotice,
  showError,
  retryButtonProps,
  showLoading,
  loadingProps,
  loadingLabel,
  showLists,
  confirmDialog,
}: TradesScreenModel) {
  return <PageContainer as="main" id="main" tabIndex={-1}>
    <PageHead title="Trade">
      {/* while the composer is open its own submit is the page's one bubblegum action */}
      <Button variant={compose ? 'default' : 'primary'} {...newTradeButtonProps}>{newTradeButtonLabel}</Button>
    </PageHead>
    {/* both regions are mounted in every state and only their text swaps: a live region inserted
        together with its content is commonly missed, and this is the irreversible surface */}
    <div className={liveRegion} {...noticeProps}>{msg && <Notice tone="ok" role="none">{msg}</Notice>}</div>
    <div className={liveRegion} {...errorNoticeProps}>{showErrorNotice && <Notice tone="error" role="none">{err}</Notice>}</div>
    <div className="[&>*+*]:mt-8">
      {compose && (compose.noFriends
        ? <EmptyState role="none">
            <p>Trading needs a friend first.</p>
            <EmptyActions><Link className={buttonClasses('primary')} to="/friends">Find your people</Link></EmptyActions>
          </EmptyState>
        : <Panel>
            <PanelHeading size="composer" className="mb-0">New trade</PanelHeading>
            <p className="m-0 mt-1.5 text-small font-medium text-ink-muted">Build a fair-ish deal with your people.</p>
            <form className={cn(composeGrid, 'mt-5')} {...compose.formProps}>
              <Field><FieldLabel>Trade with</FieldLabel><Select items={[{ value: '', label: 'Pick a friend…' }, ...compose.friends.map((friend) => ({ value: friend.sub, label: friend.name }))]} {...compose.friendSelectProps} /></Field>
              <Fieldset>
                <FieldsetLegend className={composeLegend}>You give</FieldsetLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>You give (from your binder)</FieldLabel><Select items={withNoMeme(compose.binderOptions)} {...compose.offerMemeSelectProps} /></Field>
                  {compose.showOfferShares && <Field><FieldLabel>Shares to give</FieldLabel><Input type="number" {...compose.offerSharesInputProps} /><FieldHint>{compose.offerSharesHint}</FieldHint></Field>}
                  <Field><FieldLabel>Braincells you add</FieldLabel><Input type="number" {...compose.offerCoinsInputProps} /><FieldHint>{compose.offerCoinsHint}</FieldHint></Field>
                </div>
              </Fieldset>
              <Fieldset>
                <FieldsetLegend className={composeLegend}>You want</FieldsetLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>You want (their memes)</FieldLabel><Select items={withNoMeme(compose.theirMemeOptions)} {...compose.askMemeSelectProps} /></Field>
                  {compose.showAskShares && <Field><FieldLabel>Shares you want</FieldLabel><Input type="number" {...compose.askSharesInputProps} /></Field>}
                  <Field><FieldLabel>Braincells you want</FieldLabel><Input type="number" {...compose.askCoinsInputProps} /></Field>
                </div>
              </Fieldset>
              {compose.error && <Notice tone="error" {...compose.errorNoticeProps}>{compose.error}</Notice>}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5">
                <span className="text-small text-ink-muted">They get a notification — nothing moves until they accept.</span>
                <Button variant="primary" type="submit" className="max-md:w-full" {...compose.proposeButtonProps}>Propose trade</Button>
              </div>
            </form>
          </Panel>)}
      {showLoading && <div className={rowList} {...loadingProps}>
        <span className="sr-only">{loadingLabel}</span>
        {SKELETON_ROWS.map((row) => <SkeletonRow key={row} className="min-h-[180px]" />)}
      </div>}
      {showError && <EmptyState error {...errorNoticeProps}>
        <p><strong>{err}</strong></p>
        <EmptyActions><Button variant="primary" {...retryButtonProps}>Try again</Button></EmptyActions>
      </EmptyState>}
      {showLists && <>
        <section aria-labelledby="trades-open">
          <div className={headingRow}>
            <h3 id="trades-open" className={listHeading}>Open proposals</h3>
            {openCountLabel && <span className={countNote}>{openCountLabel}</span>}
          </div>
          {open.length === 0 ? <EmptyState role="none">Nothing pending. Propose something outrageous.</EmptyState> : <div className={rowList}>{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
        <section aria-labelledby="trades-history">
          <div className={headingRow}>
            <h3 id="trades-history" className={listHeading}>History</h3>
          </div>
          {history.length === 0 ? <EmptyState role="none">No trade history yet.</EmptyState> : <div className={rowList}>{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
      </>}
    </div>
    <ConfirmDialog model={confirmDialog} />
  </PageContainer>
}
