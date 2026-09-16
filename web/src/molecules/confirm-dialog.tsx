import { Button } from '@/atoms/button'
import { DialogFooter } from '@/atoms/dialog'
import { Field, FieldCounter, FieldDescription, FieldFooter, FieldLabel } from '@/atoms/field'
import { Textarea } from '@/atoms/textarea'
import type { ConfirmDialogModel } from '../lib/confirmDialogModel'
import { DialogFrame } from '@/molecules/dialog-frame'

/**
 * The app's confirmation modal: an `alertdialog` whose message is its description, so a screen
 * reader reads the stakes with the name. Render it always; the model controls visibility.
 *
 * It rides `DialogFrame` rather than the `alert-dialog` atom on purpose: Base UI's AlertDialog
 * refuses the outside press, and this model's contract (six screens, the focus-restore story) is
 * that Escape and a press on the scrim both cancel.
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
        <Field>
          <FieldLabel>{model.prompt.label}</FieldLabel>
          <Textarea className="w-full" {...model.prompt.textareaProps} />
          <FieldFooter>
            {model.prompt.hint && (
              <FieldDescription id={model.prompt.hintId}>{model.prompt.hint}</FieldDescription>
            )}
            <FieldCounter>{model.prompt.counterLabel}</FieldCounter>
          </FieldFooter>
        </Field>
      )}
      {/* Cancel left, commit right — the tinted destructive pill when the stakes are */}
      <DialogFooter>
        <Button {...model.cancelButtonProps}>{model.cancelLabel}</Button>
        <Button variant={model.danger ? 'destructive' : 'primary'} {...model.confirmButtonProps}>
          {model.confirmLabel}
        </Button>
      </DialogFooter>
    </DialogFrame>
  )
}
