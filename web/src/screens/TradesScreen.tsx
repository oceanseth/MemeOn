import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Field, FieldHint, FieldLabel } from '../atoms/Field'
import { Fieldset, FieldsetLegend } from '../atoms/Fieldset'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
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

/** `.form-grid` */
const formGrid = 'flex max-w-[560px] flex-col gap-3.5'

/**
 * Give and want are one comparison: side by side once the panel is wider than two 560px forms,
 * instead of a single column down the left half of a 1,140px card.
 */
const composeGrid = cn(
  formGrid,
  '[&>[data-slot=fieldset]+[data-slot=fieldset]]:mt-2',
  '2xl:grid 2xl:max-w-none 2xl:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:gap-x-6',
  '2xl:[&>[data-slot=fieldset]+[data-slot=fieldset]]:mt-0',
  '2xl:[&>*:not([data-slot=fieldset])]:col-span-full',
)

/** `.row-list` */
const rowList = 'flex flex-col gap-2.5'

/** the section headings the two lists sit under */
const listHeading = 'mt-0 mb-2 text-lg leading-[1.2] font-bold'

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
    <PageHead title="Trade" className="[&_:where(h1,h2)]:font-bold">
      <Button variant="primary" {...newTradeButtonProps}>{newTradeButtonLabel}</Button>
    </PageHead>
    {/* both regions are mounted in every state and only their text swaps: a live region inserted
        together with its content is commonly missed, and this is the irreversible surface */}
    <div className={liveRegion} {...noticeProps}>{msg && <Notice tone="ok" role="none">{msg}</Notice>}</div>
    <div className={liveRegion} {...errorNoticeProps}>{showErrorNotice && <Notice tone="error" role="none">{err}</Notice>}</div>
    <div className="[&>*+*]:mt-6">
      {compose && (compose.noFriends
        ? <EmptyState role="none">
            <p>Trading needs a friend first.</p>
            <EmptyActions><Link className={buttonClasses('primary')} to="/friends">Find your people</Link></EmptyActions>
          </EmptyState>
        : <Panel>
            <form className={composeGrid} {...compose.formProps}>
              <Fieldset>
                <FieldsetLegend>You give</FieldsetLegend>
                <div className={formGrid}>
                  <Field><FieldLabel>Trade with</FieldLabel><Select items={[{ value: '', label: 'Pick a friend…' }, ...compose.friends.map((friend) => ({ value: friend.sub, label: friend.name }))]} {...compose.friendSelectProps} /></Field>
                  <Field><FieldLabel>You give (from your binder)</FieldLabel><Select items={withNoMeme(compose.binderOptions)} {...compose.offerMemeSelectProps} /></Field>
                  {compose.showOfferShares && <Field><FieldLabel>Shares to give</FieldLabel><Input type="number" {...compose.offerSharesInputProps} /><FieldHint>{compose.offerSharesHint}</FieldHint></Field>}
                  <Field><FieldLabel>Braincells you add</FieldLabel><Input type="number" {...compose.offerCoinsInputProps} /><FieldHint>{compose.offerCoinsHint}</FieldHint></Field>
                </div>
              </Fieldset>
              <Fieldset>
                <FieldsetLegend>You want</FieldsetLegend>
                <div className={formGrid}>
                  <Field><FieldLabel>You want (their memes)</FieldLabel><Select items={withNoMeme(compose.theirMemeOptions)} {...compose.askMemeSelectProps} /></Field>
                  {compose.showAskShares && <Field><FieldLabel>Shares you want</FieldLabel><Input type="number" {...compose.askSharesInputProps} /></Field>}
                  <Field><FieldLabel>Braincells you want</FieldLabel><Input type="number" {...compose.askCoinsInputProps} /></Field>
                </div>
              </Fieldset>
              {compose.error && <Notice tone="error" {...compose.errorNoticeProps}>{compose.error}</Notice>}
              <div><Button variant="primary" type="submit" {...compose.proposeButtonProps}>Propose trade</Button></div>
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
          <h3 id="trades-open" className={listHeading}>Open proposals</h3>
          {open.length === 0 ? <EmptyState role="none">Nothing pending. Propose something outrageous.</EmptyState> : <div className={rowList}>{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
        <section aria-labelledby="trades-history">
          <h3 id="trades-history" className={listHeading}>History</h3>
          {history.length === 0 ? <EmptyState role="none">No trade history yet.</EmptyState> : <div className={rowList}>{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
      </>}
    </div>
    <ConfirmDialog model={confirmDialog} />
  </PageContainer>
}
