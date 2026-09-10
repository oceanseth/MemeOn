import { Badge } from '../atoms/Badge'
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

/** UA paragraph rhythm, which preflight resets: the disclaimer copy reads as prose, not a stack. */
const prose = 'leading-[1.55] [margin-block:1em]'

/** `.person-row`, reproduced with utilities: one key row, still shared with Friends/Leaderboard's literal class. */
const keyRow = cn(
  'flex flex-wrap items-center gap-3 gap-y-2 rounded-[12px] border border-border bg-bg-raised p-3',
)

/** `.row-list` */
const rowList = 'mt-2.5 flex flex-col gap-2.5'

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
  quotaLabel,
  quotaNote,
  createLabel,
  copyLabel,
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
    <PageContainer as="main" narrow id="main" tabIndex={-1}>
      <PageHead title="🔧 Developers" className="[&_:where(h1,h2)]:font-bold">
        <a className={buttonClasses()} href="/skill.md" target="_blank" rel="noreferrer">
          📜 API skill.md
        </a>
      </PageHead>
      <p className={cn(prose, 'text-text-dim')}>
        API keys act as <strong>your account</strong>: they can mint memes, gift shares (including
        to users your own site knows only by Masky avatar id), trade, and read everything you can.
        Full endpoint reference lives in{' '}
        <a href="/skill.md" target="_blank" rel="noreferrer">
          skill.md
        </a>{' '}
        (also at <code>/.well-known/skill.md</code> for agents). Treat keys like passwords.
      </p>

      <Panel className="mt-4">
        <form className="flex flex-wrap items-center gap-2.5" {...createFormProps}>
          <Input
            placeholder="Key label (e.g. my-trading-bot)"
            className="min-w-60 flex-[1_1_240px]"
            {...labelInputProps}
          />
          <Button variant="primary" type="submit" {...createButtonProps}>
            <span aria-hidden="true">＋</span> {createLabel}
          </Button>
        </form>
        {quotaNote && <Hint>{quotaNote}</Hint>}
        {showErr && (
          <Notice tone="error" {...errorNoticeProps}>
            {err}
          </Notice>
        )}
        <div {...freshKeyRegionProps}>
          {showFreshKey && (
            <Notice tone="ok">
              <strong>Copy it now — shown once:</strong>
              <div
                className="my-2 font-mono text-sm [overflow-wrap:anywhere] select-all"
                {...freshKeyProps}
              >
                {freshKey}
              </div>
              <Button {...copyButtonProps}>
                {copyLabel}
                {copyDone && <span aria-hidden="true"> ✓</span>}
              </Button>
            </Notice>
          )}
        </div>
      </Panel>

      <Panel className="mt-4">
        <h3>
          Your keys{quotaLabel && <> <Badge>{quotaLabel}</Badge></>}
        </h3>
        <div {...statusRegionProps}>
          {showOk && <Notice tone="ok">{okMsg}</Notice>}
        </div>
        {showSpinner && (
          /* `.loading-state`: a labelled spinner row, never a bare spinner */
          <div
            data-slot="loading-state"
            className="flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-text-dim"
            {...loadingProps}
          >
            <Spinner />
            {loadingLabel}
          </div>
        )}
        {showLoadError && (
          <EmptyState error {...loadErrorProps}>
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
          <EmptyState>
            <p>{emptyCopy}</p>
            <p>{emptyHint}</p>
          </EmptyState>
        )}
        {showKeys && keys && (
          <ul className={rowList}>
            {keys.map((k) => (
              <li key={k.prefix} className={keyRow}>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold whitespace-normal [overflow-wrap:anywhere]">
                    {k.label}
                  </span>
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs text-text-dim [font-variant-numeric:tabular-nums]">
                    <code>{k.prefix}…</code>
                    <time dateTime={k.createdAt}>{k.createdLabel}</time>
                  </span>
                </div>
                <Button variant="danger" className="shrink-0" {...k.revokeButtonProps}>
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
