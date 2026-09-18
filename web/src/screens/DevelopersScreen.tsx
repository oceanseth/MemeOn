import { Alert, AlertTitle } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardTitle } from '@/atoms/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@/atoms/empty'
import { Hint } from '@/atoms/field'
import { InlineLink } from '@/atoms/inline-link'
import { Input } from '@/atoms/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/atoms/item'
import { LiveRegion } from '@/atoms/live-region'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Spinner } from '@/atoms/spinner'
import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { ConfirmDialog } from '@/molecules/confirm-dialog'
import { Icon } from '@/atoms/icon'

const EXPLAINER = 'mt-0 mb-0 max-w-[65ch] text-base text-muted-foreground'

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
      <PageHead
        level="h1"
        title={
          <span className="inline-flex items-center gap-2">
            <Icon name="wrench" size={20} /> Developers
          </span>
        }
        className="mb-5"
      >
        <a className={buttonVariants()} href="/skill.md" target="_blank" rel="noreferrer">
          <span aria-hidden="true">
            <Icon name="scroll-text" size={16} />
          </span>{' '}
          API skill.md
        </a>
      </PageHead>
      <p className={EXPLAINER}>
        API keys act as <strong className="font-semibold text-foreground">your account</strong>: they can mint
        memes, gift shares (including to users your own site knows only by Masky avatar id), trade,
        and read everything you can. Full endpoint reference lives in{' '}
        <InlineLink href="/skill.md" target="_blank" rel="noreferrer">
          skill.md
        </InlineLink>{' '}
        (also at <code>/.well-known/skill.md</code> for agents). Treat keys like passwords.
      </p>

      <Card size="sm" className="mt-5">
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
            <span aria-hidden="true">
              <Icon name="circle-plus" size={16} />
            </span>{' '}
            {createLabel}
          </Button>
        </form>
        {quotaNote && <Hint>{quotaNote}</Hint>}
      </Card>

      {showErr && (
        <Alert variant="error" size="compact" className="mt-4 block max-w-none" {...errorNoticeProps}>
          <AlertTitle>{err}</AlertTitle>
        </Alert>
      )}

      {/* persistent wrapper, mounted before its text arrives, so the key itself is announced */}
      <LiveRegion variant="visible" {...freshKeyRegionProps}>
        {showFreshKey && (
          <Card size="sm" variant="highlighted" className="mt-5">
            <p className="m-0 text-lg font-semibold text-foreground">{freshKeyHeading}</p>
            <div
              className="mt-2.5 font-mono text-base font-semibold text-foreground wrap-anywhere select-all"
              {...freshKeyProps}
            >
              {freshKey}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <Button {...copyButtonProps}>{copyLabel}</Button>
              {copyDone && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-foreground">
                  {/* the tick is the screen's, not the caption's: `copyDone` already gates this
                      span, so the state is drawn here and `copy/developers` spells only words */}
                  <Icon name="circle-check" size={14} />
                  {copiedCaption}
                </span>
              )}
            </div>
          </Card>
        )}
      </LiveRegion>

      <Card size="sm" className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <CardTitle render={<h2 />}>{keysHeading}</CardTitle>
          {quotaLabel && (
            <span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
              {quotaLabel}
            </span>
          )}
        </div>
        <LiveRegion variant="visible" {...statusRegionProps}>
          {showOk && <Alert variant="success" className="mt-3">{okMsg}</Alert>}
        </LiveRegion>
        {showSpinner && (
          /* a labelled spinner row, never a bare spinner */
          <div
            data-slot="loading-state"
            className="flex items-center justify-center gap-2.5 px-5 py-15 text-base text-muted-foreground"
            {...loadingProps}
          >
            <Spinner />
            {loadingLabel}
          </div>
        )}
        {showLoadError && (
          <Empty variant="error" className="mt-2" {...loadErrorProps}>
            <EmptyDescription>
              <strong>{loadErrorMessage}</strong>
            </EmptyDescription>
            <EmptyContent>
              <Button variant="primary" {...retryButtonProps}>
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {showEmpty && (
          <Empty className="mt-2">
            <EmptyHeader>
              <EmptyDescription>{emptyCopy}</EmptyDescription>
              <EmptyDescription>{emptyHint}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {showKeys && keys && (
          <ul className="m-0 mt-2 list-none divide-y divide-border p-0 *:py-3">
            {keys.map((k) => (
              <Item key={k.prefix} size="flush" render={<li />} data-slot="api-key-row">
                <ItemContent>
                  {/* `overflow-wrap:anywhere` keeps a 60-character label inside the row */}
                  <ItemTitle>{k.label}</ItemTitle>
                  <ItemDescription>
                    {k.prefix}… · <time dateTime={k.createdAt}>{k.createdLabel}</time>
                  </ItemDescription>
                </ItemContent>
                {/* the destructive act is tinted, never the page's primary plate */}
                <ItemActions>
                  <Button variant="destructive" className="shrink-0" {...k.revokeButtonProps}>
                    Revoke
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog model={confirmDialog} />
    </PageContainer>
  )
}
