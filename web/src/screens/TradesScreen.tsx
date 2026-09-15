import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '@/atoms/button'
import { EmptyActions, EmptyState } from '@/atoms/empty-state'
import { Field, FieldHint, FieldLabel } from '@/atoms/field'
import { Fieldset, FieldsetLegend } from '@/atoms/fieldset'
import { Input } from '@/atoms/input'
import { Notice } from '@/atoms/notice'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Panel, PanelHeading } from '@/atoms/panel'
import { Select } from '@/atoms/select'
import { SkeletonRow } from '@/atoms/skeleton'
import { cn } from '../lib/cn'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import {
  columnFields, composeGrid, composeLegend, composerIntro, countNote, headingRow, listHeading,
  liveRegion, proposeCaption, proposeRow, rowList,
} from '../lib/tradesScreenLayout'
import { ConfirmDialog } from '@/molecules/confirm-dialog'
import { TradeCard } from '@/molecules/trade-card'

const SKELETON_ROWS = ['a', 'b', 'c']

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
    <div className={liveRegion} {...noticeProps}>{msg && <Notice tone="ok" role="none">{msg}</Notice>}</div>
    <div className={liveRegion} {...errorNoticeProps}>{showErrorNotice && <Notice tone="error" role="none">{err}</Notice>}</div>
    <div className="[&>*+*]:mt-8">
      {compose && (compose.noFriends
        ? <EmptyState role="none" id={compose.formProps.id}>
            <p>{compose.noFriendsMessage}</p>
            <EmptyActions><Link className={buttonClasses('primary')} {...compose.findFriendsLinkProps}>{compose.findFriendsLabel}</Link></EmptyActions>
          </EmptyState>
        : <Panel>
            <PanelHeading size="composer" className="mb-0">{compose.heading}</PanelHeading>
            <p className={composerIntro}>{compose.intro}</p>
            <form className={cn(composeGrid, 'mt-5')} {...compose.formProps}>
              <Field><FieldLabel>{compose.tradeWithLabel}</FieldLabel><Select items={compose.friendSelectItems} {...compose.friendSelectProps} /></Field>
              <Fieldset>
                <FieldsetLegend className={composeLegend}>{compose.youGiveLegend}</FieldsetLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>{compose.youGiveBinderLabel}</FieldLabel><Select items={compose.offerMemeSelectItems} {...compose.offerMemeSelectProps} /></Field>
                  {compose.showOfferShares && <Field><FieldLabel>{compose.sharesToGiveLabel}</FieldLabel><Input type="number" {...compose.offerSharesInputProps} /><FieldHint>{compose.offerSharesHint}</FieldHint></Field>}
                  <Field><FieldLabel>{compose.braincellsAddLabel}</FieldLabel><Input type="number" {...compose.offerCoinsInputProps} /><FieldHint>{compose.offerCoinsHint}</FieldHint></Field>
                </div>
              </Fieldset>
              <Fieldset>
                <FieldsetLegend className={composeLegend}>{compose.youWantLegend}</FieldsetLegend>
                <div className={columnFields}>
                  <Field><FieldLabel>{compose.youWantMemesLabel}</FieldLabel><Select items={compose.askMemeSelectItems} {...compose.askMemeSelectProps} /></Field>
                  {compose.showAskShares && <Field><FieldLabel>{compose.sharesToWantLabel}</FieldLabel><Input type="number" {...compose.askSharesInputProps} /></Field>}
                  <Field><FieldLabel>{compose.braincellsWantLabel}</FieldLabel><Input type="number" {...compose.askCoinsInputProps} /></Field>
                </div>
              </Fieldset>
              {compose.error && <Notice tone="error" {...compose.errorNoticeProps}>{compose.error}</Notice>}
              <div className={proposeRow}>
                <span className={proposeCaption}>{compose.proposeCaption}</span>
                <Button variant="primary" type="submit" className="max-md:w-full" {...compose.proposeButtonProps}>{compose.proposeButtonLabel}</Button>
              </div>
            </form>
          </Panel>)}
      {showLoading && <div className={rowList} {...loadingProps}>
        <span className="sr-only">{loadingLabel}</span>
        {SKELETON_ROWS.map((row) => <SkeletonRow key={row} className="min-h-45" />)}
      </div>}
      {showError && <EmptyState error {...errorNoticeProps}>
        <p><strong>{err}</strong></p>
        <EmptyActions><Button variant="primary" {...retryButtonProps}>{retryLabel}</Button></EmptyActions>
      </EmptyState>}
      {showLists && <>
        <section aria-labelledby="trades-open">
          <div className={headingRow}>
            <h3 id="trades-open" className={listHeading}>{openHeading}</h3>
            {openCountLabel && <span className={countNote}>{openCountLabel}</span>}
          </div>
          {open.length === 0 ? <EmptyState role="none">{openEmptyMessage}</EmptyState> : <div className={rowList}>{open.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
        <section aria-labelledby="trades-history">
          <div className={headingRow}>
            <h3 id="trades-history" className={listHeading}>{historyHeading}</h3>
          </div>
          {history.length === 0 ? <EmptyState role="none">{historyEmptyMessage}</EmptyState> : <div className={rowList}>{history.map((trade) => <TradeCard key={trade.id} model={trade} />)}</div>}
        </section>
      </>}
    </div>
    <ConfirmDialog model={confirmDialog} />
  </PageContainer>
}
