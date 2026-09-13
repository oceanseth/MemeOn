import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { Hint } from '../atoms/Field'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

const EXPLAINER = 'mt-0 mb-0 max-w-measure text-body text-ink-muted'
const FORM_CARD = 'mt-5 p-gutter max-md:p-gutter'
/** Fresh key state: inset action ring marks the one-time reveal. */
const FRESH_CARD = 'mt-5 p-5 max-md:p-5 inset-ring-2 inset-ring-action'
const INVENTORY_CARD = 'mt-5 p-5.5 max-md:p-gutter'
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
        <a
          className="text-link underline underline-offset-[3px] decoration-1"
          href="/skill.md"
          target="_blank"
          rel="noreferrer"
        >
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
        <Notice
          tone="error"
          compact
          className="mt-4 block max-w-none font-semibold"
          {...errorNoticeProps}
        >
          {err}
        </Notice>
      )}

      {/* persistent wrapper, mounted before its text arrives, so the key itself is announced */}
      <div {...freshKeyRegionProps}>
        {showFreshKey && (
          <Panel className={FRESH_CARD}>
            <p className="m-0 text-intro font-semibold text-ink">{freshKeyHeading}</p>
            <div
              className="mt-2.5 font-mono text-label font-bold text-ink [overflow-wrap:anywhere] select-all"
              {...freshKeyProps}
            >
              {freshKey}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <Button {...copyButtonProps}>{copyLabel}</Button>
              {copyDone && (
                <span className="text-caption font-bold text-success-text">{copiedCaption}</span>
              )}
            </div>
          </Panel>
        )}
      </div>

      <Panel className={INVENTORY_CARD}>
        <div className="flex items-center justify-between gap-4">
          <PanelHeading size="section" className="mb-0">{keysHeading}</PanelHeading>
          {quotaLabel && (
            <span className="shrink-0 text-caption font-medium text-ink-muted [font-variant-numeric:tabular-nums]">
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
                <div className="flex min-w-0 flex-col gap-0.75">
                  {/* `overflow-wrap:anywhere` keeps a 60-character label inside the row */}
                  <span className="text-body font-semibold text-ink [overflow-wrap:anywhere]">
                    {k.label}
                  </span>
                  <span className="text-caption font-medium text-ink-muted [font-variant-numeric:tabular-nums]">
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
