import { Button } from '@/atoms/button'
import { Field, FieldDescription, FieldLabel } from '@/atoms/field'
import { Input } from '@/atoms/input'
import { Textarea } from '@/atoms/textarea'
import { Toolbar } from '@/atoms/toolbar'
import { Icon } from '@/atoms/icon'
import type { CreateMemeScreenModel } from '../lib/createMemeModel'

/**
 * A caption row sits 4px under its control on this form, where `Field`'s own rhythm is the 6px it
 * puts between a label and its control. `-mt-0.5` spends the difference, so the pair reads as one
 * unit.
 */
const CAPTION_OFFSET = '-mt-0.5'
const COST_NOTE = 'text-sm font-semibold text-muted-foreground'

export type CreateMemeUrlPanelProps = Pick<
  CreateMemeScreenModel,
  | 'urlFieldLabel'
  | 'urlInputProps'
  | 'urlPlaceholder'
  | 'urlHelpText'
  | 'fetchUrlButtonProps'
  | 'fetchUrlButtonLabel'
  | 'urlOptionalPromptLabel'
  | 'urlPromptTextareaProps'
  | 'urlRemixPlaceholder'
  | 'showUrlApplyEdit'
  | 'applyUrlEditButtonProps'
  | 'applyUrlEditLabel'
  | 'creditsNote'
> & {
  urlHelpId: string
}

/** Paste a page or image URL, then optionally run Masky over the resolved still. */
export function CreateMemeUrlPanel({
  urlFieldLabel,
  urlInputProps,
  urlPlaceholder,
  urlHelpText,
  urlHelpId,
  fetchUrlButtonProps,
  fetchUrlButtonLabel,
  urlOptionalPromptLabel,
  urlPromptTextareaProps,
  urlRemixPlaceholder,
  showUrlApplyEdit,
  applyUrlEditButtonProps,
  applyUrlEditLabel,
  creditsNote,
}: CreateMemeUrlPanelProps) {
  return (
    <div data-slot="create-meme-url-panel" className="contents">
      <Field>
        <FieldLabel>{urlFieldLabel}</FieldLabel>
        <Input {...urlInputProps} placeholder={urlPlaceholder} />
        <FieldDescription className={CAPTION_OFFSET} id={urlHelpId}>
          {urlHelpText}
        </FieldDescription>
      </Field>
      <div>
        <Button {...fetchUrlButtonProps}>{fetchUrlButtonLabel}</Button>
      </div>
      <Field>
        <FieldLabel>{urlOptionalPromptLabel}</FieldLabel>
        <Textarea {...urlPromptTextareaProps} rows={2} placeholder={urlRemixPlaceholder} />
      </Field>
      {showUrlApplyEdit && (
        <Toolbar className="mt-1">
          <Button variant="primary" {...applyUrlEditButtonProps}>
            <Icon name="sparkles" size={16} /> {applyUrlEditLabel}
          </Button>
          <span className={COST_NOTE}>{creditsNote}</span>
        </Toolbar>
      )}
    </div>
  )
}
