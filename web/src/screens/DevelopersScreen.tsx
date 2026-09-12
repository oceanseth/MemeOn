import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Hint } from '../atoms/Field'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

/**
 * The security explainer (`FAL-0`): 16/20 weight 500 on `ink-muted`, above the form and at the
 * board's own 959px measure — prose on the page, not a card.
 */
const EXPLAINER = 'mt-0 mb-0 max-w-[960px] text-[16px]/[20px] font-medium text-ink-muted'

/** Create key form (`FAN-0`): a raised card, 18 padding, gap 12; the phone drops the button. */
const FORM_CARD = 'mt-5 p-[18px] max-md:p-[18px]'

/** Fresh key one-time state (`FAT-0`): the card plus the 2px inset action ring that names it. */
const FRESH_CARD = 'mt-5 p-5 max-md:p-5 inset-ring-2 inset-ring-action'

/**
 * API key inventory (`FB0-0`): 22 padding, its rows divided by the board's one hairline, and the
 * 18/22 section heading `MCT-0` draws — `[&_h3]` outranks `Panel`'s own `:where(h3,h4)` at 17/21.
 */
const INVENTORY_CARD = cn(
  'mt-5 p-[22px] max-md:p-[18px]',
  '[&_h3]:mb-0 [&_h3]:text-[18px]/[22px] [&_h3]:tracking-title',
)

/** One key row (`MCV-0`): space-between, 12 block padding, a hairline above every row but the first. */
const KEY_ROW = 'flex flex-wrap items-center justify-between gap-4 gap-y-2.5 py-3'

/** Developers API-key page as a function of its model. Every engine state is one set of args. */
export function DevelopersScreen({
  keys,
  freshKey,
  err,
  showSpinner,
  showEmpty,
  showKeys,
  showErr,
  showFreshKey,
  showLoadError,
  showOk,
  okMsg,
  emptyCopy,
  emptyHint,
  loadingLabel,
  loadErrorMessage,
  keysHeading,
  quotaLabel,
  quotaNote,
  createLabel,
  freshKeyHeading,
  copyLabel,
  copiedCaption,
  copyDone,
  labelInputProps,
  createFormProps,
  createButtonProps,
  copyButtonProps,
  retryButtonProps,
  freshKeyProps,
  freshKeyRegionProps,
  statusRegionProps,
  loadingProps,
  errorNoticeProps,
  loadErrorProps,
  confirmDialog,
}: DevelopersScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title="🔧 Developers" className="mb-5">
        <a className={buttonClasses()} href="/skill.md" target="_blank" rel="noreferrer">
          📜 API skill.md
        </a>
      </PageHead>
      <p className={EXPLAINER}>
        API keys act as <strong className="font-bold text-ink">your account</strong>: they can mint
        memes, gift shares (including to users your own site knows only by Masky avatar id), trade,
        and read everything you can. Full endpoint reference lives in{' '}
        <a href="/skill.md" target="_blank" rel="noreferrer">
          skill.md
        </a>{' '}
        (also at <code>/.well-known/skill.md</code> for agents). Treat keys like passwords.
      </p>

      <Panel className={FORM_CARD}>
        <form
          className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-start"
          {...createFormProps}
        >
          <Input
            placeholder="Key label (e.g. my-trading-bot)"
            /* the phone stacks the form, where `flex-basis` would size the well's *height* */
            className="min-w-60 flex-[1_1_240px] max-md:w-full max-md:min-w-0 max-md:flex-none"
            {...labelInputProps}
          />
          <Button variant="primary" type="submit" className="shrink-0" {...createButtonProps}>
            <span aria-hidden="true">＋</span> {createLabel}
          </Button>
        </form>
        {quotaNote && <Hint>{quotaNote}</Hint>}
      </Panel>

      {showErr && (
        /* the board's inline alert (`MG1-0`): the error pair at the field radius, one line tall */
        <Notice
          tone="error"
          className="mt-4 block max-w-none rounded-field font-semibold"
          {...errorNoticeProps}
        >
          {err}
        </Notice>
      )}

      {/* persistent wrapper, mounted before its text arrives, so the key itself is announced */}
      <div {...freshKeyRegionProps}>
        {showFreshKey && (
          <Panel className={FRESH_CARD}>
            <p className="m-0 text-intro font-extrabold text-ink">{freshKeyHeading}</p>
            <div
              className="mt-2.5 font-mono text-label font-bold text-ink [overflow-wrap:anywhere] select-all"
              {...freshKeyProps}
            >
              {freshKey}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <Button {...copyButtonProps}>{copyLabel}</Button>
              {copyDone && (
                <span className="text-[13px]/[16px] font-bold text-success-text">{copiedCaption}</span>
              )}
            </div>
          </Panel>
        )}
      </div>

      <Panel className={INVENTORY_CARD}>
        <div className="flex items-center justify-between gap-4">
          <h3>{keysHeading}</h3>
          {quotaLabel && (
            <span className="shrink-0 text-[13px]/[16px] font-medium text-ink-muted [font-variant-numeric:tabular-nums]">
              {quotaLabel}
            </span>
          )}
        </div>
        <div {...statusRegionProps}>
          {showOk && <Notice tone="ok">{okMsg}</Notice>}
        </div>
        {showSpinner && (
          /* a labelled spinner row, never a bare spinner */
          <div
            data-slot="loading-state"
            className="flex items-center justify-center gap-2.5 px-5 py-15 text-label text-ink-muted"
            {...loadingProps}
          >
            <Spinner />
            {loadingLabel}
          </div>
        )}
        {showLoadError && (
          <EmptyState tone="error" className="mt-2" {...loadErrorProps}>
            <p>
              <strong>{loadErrorMessage}</strong>
            </p>
            <EmptyActions>
              <Button variant="primary" {...retryButtonProps}>
                Try again
              </Button>
            </EmptyActions>
          </EmptyState>
        )}
        {showEmpty && (
          <EmptyState className="mt-2">
            <p>{emptyCopy}</p>
            <p>{emptyHint}</p>
          </EmptyState>
        )}
        {showKeys && keys && (
          <ul className="m-0 mt-2 list-none p-0 [&>li+li]:border-t [&>li+li]:border-line">
            {keys.map((k) => (
              <li key={k.prefix} className={KEY_ROW}>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  {/* `overflow-wrap:anywhere` keeps a 60-character label inside the row */}
                  <span className="text-[16px]/[20px] font-bold text-ink [overflow-wrap:anywhere]">
                    {k.label}
                  </span>
                  <span className="text-[13px]/[16px] font-medium text-ink-muted [font-variant-numeric:tabular-nums]">
                    {k.prefix}… · <time dateTime={k.createdAt}>{k.createdLabel}</time>
                  </span>
                </div>
                {/* the destructive act on a neutral pill: the page's one primary is "Create key" */}
                <Button className="shrink-0 text-error-text" {...k.revokeButtonProps}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ConfirmDialog model={confirmDialog} />
    </PageContainer>
  )
}
