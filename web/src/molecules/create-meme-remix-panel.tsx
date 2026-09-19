import type { ReactNode } from 'react'
import { Button } from '@/atoms/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import { Field, FieldLabel, Hint } from '@/atoms/field'
import { Select } from '@/atoms/select'
import { Spinner } from '@/atoms/spinner'
import { Textarea } from '@/atoms/textarea'
import { Toolbar } from '@/atoms/toolbar'
import { Icon } from '@/atoms/icon'
import type { CreateMemeScreenModel } from '../lib/createMemeModel'

const COST_NOTE = 'text-sm font-semibold text-muted-foreground'
const LOADING_STATE = 'flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-muted-foreground'

export type CreateMemeRemixPanelProps = Pick<
  CreateMemeScreenModel,
  | 'remixSource'
  | 'remixSourceLoadingText'
  | 'remixingPrefix'
  | 'remixingBy'
  | 'remixOutputLabel'
  | 'remixOutputSelectProps'
  | 'showVideoRemixStyle'
  | 'videoRemixStyleLabel'
  | 'videoModeSelectProps'
  | 'remixPromptLabel'
  | 'remixPromptTextareaProps'
  | 'remixPromptPlaceholder'
  | 'showEditedFrameApproval'
  | 'approvalTitle'
  | 'approvalBody'
  | 'motionLabel'
  | 'motionPromptTextareaProps'
  | 'motionPromptPlaceholder'
  | 'animateEditedButtonProps'
  | 'animateEditedLabel'
  | 'rerunEditButtonProps'
  | 'rerunEditLabel'
  | 'showRemixButton'
  | 'remixButtonProps'
  | 'remixButtonLabel'
  | 'creditsNote'
> & {
  /** Composer owns the router `Link` so this panel never imports `react-router-dom`. */
  sourceLink: ReactNode
}

/** Remix a card already on the binder. Source title link is a slot from the composer. */
export function CreateMemeRemixPanel({
  remixSource,
  remixSourceLoadingText,
  remixingPrefix,
  remixingBy,
  sourceLink,
  remixOutputLabel,
  remixOutputSelectProps,
  showVideoRemixStyle,
  videoRemixStyleLabel,
  videoModeSelectProps,
  remixPromptLabel,
  remixPromptTextareaProps,
  remixPromptPlaceholder,
  showEditedFrameApproval,
  approvalTitle,
  approvalBody,
  motionLabel,
  motionPromptTextareaProps,
  motionPromptPlaceholder,
  animateEditedButtonProps,
  animateEditedLabel,
  rerunEditButtonProps,
  rerunEditLabel,
  showRemixButton,
  remixButtonProps,
  remixButtonLabel,
  creditsNote,
}: CreateMemeRemixPanelProps) {
  return (
    <div data-slot="create-meme-remix-panel" className="contents">
      {remixSource ? (
        <Toolbar>
          <img
            {...remixSource.imageProps}
            className="size-21 rounded-md object-cover"
          />
          <Hint as="span">
            {remixingPrefix} {sourceLink}
            {remixingBy}
            {remixSource.creatorName}
          </Hint>
        </Toolbar>
      ) : (
        <div className={LOADING_STATE} role="status">
          <Spinner />
          {remixSourceLoadingText}
        </div>
      )}
      <Field>
        <FieldLabel>{remixOutputLabel}</FieldLabel>
        <Select aria-label={remixOutputLabel} {...remixOutputSelectProps} />
      </Field>
      {showVideoRemixStyle && (
        <Field>
          <FieldLabel>{videoRemixStyleLabel}</FieldLabel>
          <Select aria-label={videoRemixStyleLabel} {...videoModeSelectProps} />
        </Field>
      )}
      <Field>
        <FieldLabel>{remixPromptLabel}</FieldLabel>
        <Textarea
          {...remixPromptTextareaProps}
          rows={3}
          placeholder={remixPromptPlaceholder}
        />
      </Field>
      {showEditedFrameApproval && (
        /* wrapper keeps the named slot the atom would otherwise own.
           role="none" — panel live region already announces this turn */
        <div data-slot="approval-card">
          <Empty variant="success" size="inline" role="none">
            <EmptyHeader>
              <EmptyTitle>
                <span aria-hidden="true">
                  <Icon name="circle-check" size={18} />
                </span>{' '}
                {approvalTitle}
              </EmptyTitle>
              <EmptyDescription>{approvalBody}</EmptyDescription>
            </EmptyHeader>
            <Field className="w-full">
              <FieldLabel>{motionLabel}</FieldLabel>
              <Textarea
                {...motionPromptTextareaProps}
                rows={3}
                placeholder={motionPromptPlaceholder}
              />
            </Field>
            <Toolbar>
              <Button variant="primary" {...animateEditedButtonProps}>
                <span aria-hidden="true">
                  <Icon name="clapperboard" size={16} />
                </span>{' '}
                {animateEditedLabel}
              </Button>
              <Button {...rerunEditButtonProps}>
                <span aria-hidden="true">
                  <Icon name="rotate-cw" size={16} />
                </span>{' '}
                {rerunEditLabel}
              </Button>
            </Toolbar>
          </Empty>
        </div>
      )}
      {showRemixButton && (
        <Toolbar className="mt-1">
          <Button variant="primary" {...remixButtonProps}>
            {remixButtonLabel}
          </Button>
          <span className={COST_NOTE}>{creditsNote}</span>
        </Toolbar>
      )}
    </div>
  )
}
