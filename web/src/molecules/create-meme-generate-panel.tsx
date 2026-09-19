import { Button } from '@/atoms/button'
import { Field, FieldDescription, FieldLabel } from '@/atoms/field'
import { Textarea } from '@/atoms/textarea'
import { Toolbar } from '@/atoms/toolbar'
import type { CreateMemeScreenModel } from '../lib/createMemeModel'

/**
 * A caption row sits 4px under its control on this form, where `Field`'s own rhythm is the 6px it
 * puts between a label and its control. `-mt-0.5` spends the difference, so the pair reads as one
 * unit.
 */
const CAPTION_OFFSET = '-mt-0.5'
const COST_NOTE = 'text-sm font-semibold text-muted-foreground'

export type CreateMemeGeneratePanelProps = Pick<
  CreateMemeScreenModel,
  | 'promptLabel'
  | 'generatePromptPlaceholder'
  | 'generatePromptHelpText'
  | 'generateButtonLabel'
  | 'creditsNote'
  | 'generatePromptTextareaProps'
  | 'generateButtonProps'
> & {
  promptHelpId: string
}

/** Prompt + render action. Machine modes `generate` and `video` share this panel. */
export function CreateMemeGeneratePanel({
  promptLabel,
  generatePromptPlaceholder,
  generatePromptHelpText,
  generateButtonLabel,
  creditsNote,
  promptHelpId,
  generatePromptTextareaProps,
  generateButtonProps,
}: CreateMemeGeneratePanelProps) {
  return (
    <div data-slot="create-meme-generate-panel" className="contents">
      <Field>
        <FieldLabel>{promptLabel}</FieldLabel>
        <Textarea
          {...generatePromptTextareaProps}
          rows={3}
          placeholder={generatePromptPlaceholder}
        />
        <FieldDescription className={CAPTION_OFFSET} id={promptHelpId}>
          {generatePromptHelpText}
        </FieldDescription>
      </Field>
      <Toolbar className="mt-1">
        <Button variant="primary" {...generateButtonProps}>
          {generateButtonLabel}
        </Button>
        <span className={COST_NOTE}>{creditsNote}</span>
      </Toolbar>
    </div>
  )
}
