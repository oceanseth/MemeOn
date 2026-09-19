import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription } from '@/atoms/empty'
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@/atoms/field'
import { Heading } from '@/atoms/heading'
import { Input } from '@/atoms/input'
import { LiveRegion } from '@/atoms/live-region'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Select } from '@/atoms/select'
import { SkeletonRow } from '@/atoms/skeleton'
import { Toolbar } from '@/atoms/toolbar'
import { cn } from '../lib/cn'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { ConfirmDialog } from '@/molecules/confirm-dialog'
import { TradeCard } from '@/molecules/trade-card'

const SKELETON_ROWS = ['a', 'b', 'c']

/* One token per `cn` argument: a multi-word class string in a `screens/` file is counted as copy
   by `scripts/check-copy.mjs` (LEDGER L24). */

/** Give and get side by side at 2xl, stacked below. */
const composeGrid = cn(
  'flex flex-col gap-5',
  'xl:grid xl:grid-cols-[repeat(2,minmax(0,1fr))] xl:gap-x-7 xl:gap-y-5',
  'xl:[&>*:not([data-slot=field-set])]:col-span-full',
)
const columnFields = 'flex flex-col gap-2.5'
/** A stack of cards, evenly spaced. */
const rowList = 'flex flex-col gap-3.5'
const countNote = 'text-sm text-muted-foreground tabular-nums'
const listHeadingRow = 'mb-3.5 items-baseline'
const proposeCaption = 'text-sm text-muted-foreground'

/** Trade lists and a controlled compose panel as a function of its model. */
export function TradesScreen({
  pageTitle,
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
  retryLabel,
  showLoading,
  loadingProps,
  loadingLabel,
  showLists,
  openHeading,
  openEmptyMessage,
  historyHeading,
  historyEmptyMessage,
  confirmDialog,
}: TradesScreenModel) {
  return <PageContainer as="main" id="main" tabIndex={-1}>
    <PageHead title={pageTitle}>
      {/* while the composer is open its own submit is the page's one bubblegum action */}
      <Button variant={compose ? 'default' : 'primary'} {...newTradeButtonProps}>{newTradeButtonLabel}</Button>
    </PageHead>
    {/* both regions are mounted in every state and only their text swaps: a live region inserted
        together with its content is commonly missed, and this is the irreversible surface */}
    <LiveRegion variant="visible" className="not-empty:mb-4" {...noticeProps}>
      {msg && <Alert variant="success" role="none">{msg}</Alert>}
    </LiveRegion>
    <LiveRegion variant="visible" className="not-empty:mb-4" {...errorNoticeProps}>
      {showErrorNotice && <Alert variant="error" role="none">{err}</Alert>}
    </LiveRegion>
    <div className="[&>*+*]:mt-8">
      {compose && (compose.noFriends
        ? <Empty role="none" id={compose.formProps.id}>
            <EmptyDescription>{compose.noFriendsMessage}</EmptyDescription>
            <EmptyContent>
              <Link className={buttonVariants({ variant: 'primary' })} {...compose.findFriendsLinkProps}>{compose.findFriendsLabel}</Link>
            </EmptyContent>
          </Empty>
        : <Card>
            <CardHeader>
              <CardTitle size="title">{compose.heading}</CardTitle>
              <CardDescription>{compose.intro}</CardDescription>
            </CardHeader>
            <form className={cn(composeGrid, 'mt-5')} {...compose.formProps}>
              <Field><FieldLabel>{compose.tradeWithLabel}</FieldLabel><Select aria-label={compose.tradeWithLabel} items={compose.friendSelectItems} {...compose.friendSelectProps} /></Field>
              <FieldSet>
                <FieldLegend>{compose.youGiveLegend}</FieldLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>{compose.youGiveBinderLabel}</FieldLabel><Select aria-label={compose.youGiveBinderLabel} items={compose.giveMemeSelectItems} {...compose.giveMemeSelectProps} /></Field>
                  {compose.showGiveShares && <Field><FieldLabel>{compose.sharesToGiveLabel}</FieldLabel><Input type="number" {...compose.giveSharesInputProps} /><FieldDescription>{compose.giveSharesHint}</FieldDescription></Field>}
                  <Field><FieldLabel>{compose.braincellsAddLabel}</FieldLabel><Input type="number" {...compose.giveCoinsInputProps} /><FieldDescription>{compose.giveCoinsHint}</FieldDescription></Field>
                </div>
              </FieldSet>
              <FieldSet>
                <FieldLegend>{compose.youGetLegend}</FieldLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>{compose.youGetMemesLabel}</FieldLabel><Select aria-label={compose.youGetMemesLabel} items={compose.getMemeSelectItems} {...compose.getMemeSelectProps} /></Field>
                  {compose.showGetShares && <Field><FieldLabel>{compose.sharesToGetLabel}</FieldLabel><Input type="number" {...compose.getSharesInputProps} /></Field>}
                  <Field><FieldLabel>{compose.braincellsGetLabel}</FieldLabel><Input type="number" {...compose.getCoinsInputProps} /></Field>
                </div>
              </FieldSet>
              {compose.error && <Alert variant="error" {...compose.errorNoticeProps}>{compose.error}</Alert>}
              <Toolbar align="between">
                <span className={proposeCaption}>{compose.proposeCaption}</span>
                <Button variant="primary" type="submit" className="max-md:w-full" {...compose.proposeButtonProps}>{compose.proposeButtonLabel}</Button>
              </Toolbar>
            </form>
          </Card>)}
      {showLoading && <div className={rowList} {...loadingProps}>
        <span className="sr-only">{loadingLabel}</span>
        {SKELETON_ROWS.map((row) => <SkeletonRow key={row} className="min-h-45" />)}
      </div>}
      {showError && <Empty variant="error" {...errorNoticeProps}>
        <EmptyDescription><strong>{err}</strong></EmptyDescription>
        <EmptyContent><Button variant="primary" {...retryButtonProps}>{retryLabel}</Button></EmptyContent>
      </Empty>}
      {showLists && <>
        <section aria-labelledby="trades-open">
          <Toolbar className={listHeadingRow}>
            <Heading as="h3" id="trades-open">{openHeading}</Heading>
            {openCountLabel && <span className={countNote}>{openCountLabel}</span>}
          </Toolbar>
          {open.length === 0
            ? <Empty role="none"><EmptyDescription>{openEmptyMessage}</EmptyDescription></Empty>
            : <div className={rowList}>{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
        <section aria-labelledby="trades-history">
          <Toolbar className={listHeadingRow}>
            <Heading as="h3" id="trades-history">{historyHeading}</Heading>
          </Toolbar>
          {history.length === 0
            ? <Empty role="none"><EmptyDescription>{historyEmptyMessage}</EmptyDescription></Empty>
            : <div className={rowList}>{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
      </>}
    </div>
    <ConfirmDialog model={confirmDialog} />
  </PageContainer>
}
