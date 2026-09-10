import { Button } from '../atoms/Button'
import { Field, FieldCounter, FieldFooter, FieldHint, FieldLabel } from '../atoms/Field'
import { FilterBar } from '../atoms/PageHead'
import { Textarea } from '../atoms/Textarea'
import { cn } from '../lib/cn'
import type { ConfirmDialogModel } from '../lib/confirmDialogModel'
import { DialogFrame } from './DialogFrame'

/** 0-1-1 in the legacy sheet, so the white label beat `button.danger`; here it just wins the merge. */
const DANGER_BUTTON =
  'bg-[#a12b3a] border-transparent text-text-inverse font-bold ' +
  '[&:not(:disabled):hover]:border-danger'

/**
 * Legacy `button[aria-busy='true'] { opacity: 1 }`: in flight is not unavailable, and the label of a
 * request you cannot cancel has to stay readable. The Button atom reproduces that against its own
 * `:disabled` dimming but not against `aria-disabled`, which is exactly what a busy confirm wears —
 * and `aria-disabled:opacity-*` outranks a plain `opacity-100` on specificity. `!` settles it here
 * until the atom covers the aria-disabled case itself.
 */
const BUSY_BUTTON = 'opacity-100!'

/**
 * The app's confirmation modal: an `alertdialog` whose message is its description, so a screen
 * reader reads the stakes with the name. Render it always; the model controls visibility.
 *
 *   <ConfirmDialog model={confirmDialog} />
 */
export function ConfirmDialog({ model }: { model: ConfirmDialogModel }) {
  return (
    <DialogFrame
      id={model.id}
      open={model.open}
      onOpenChange={model.onOpenChange}
      // the model recorded the opener; without it a press on the scrim strands focus on <main>
      finalFocus={model.opener}
      role="alertdialog"
      size="sm"
      danger={model.danger}
      title={model.title}
      titleId={model.titleId}
      description={model.message}
      descriptionId={model.messageId}
      // the message carries block content on some screens (a failure notice); a <p> could not hold it
      descriptionAs="div"
    >
      {model.prompt && (
        <Field className="mt-3.5">
          <FieldLabel>{model.prompt.label}</FieldLabel>
          <Textarea className="min-h-22 w-full font-normal" {...model.prompt.textareaProps} />
          <FieldFooter>
            {model.prompt.hint && (
              <FieldHint id={model.prompt.hintId}>{model.prompt.hint}</FieldHint>
            )}
            <FieldCounter>{model.prompt.counterLabel}</FieldCounter>
          </FieldFooter>
        </Field>
      )}
      <FilterBar className="mt-[18px] justify-end">
        <Button {...model.cancelButtonProps}>{model.cancelLabel}</Button>
        <Button
          variant={model.danger ? 'default' : 'primary'}
          className={cn(model.danger && DANGER_BUTTON, model.busy && BUSY_BUTTON)}
          {...model.confirmButtonProps}
        >
          {model.confirmLabel}
        </Button>
      </FilterBar>
    </DialogFrame>
  )
}
