import { Field, FieldDescription, FieldLabel } from '@/atoms/field'
import { FileDrop } from '@/atoms/file-drop'
import type { CreateMemeScreenModel } from '../lib/createMemeModel'

/**
 * A caption row sits 4px under its control on this form, where `Field`'s own rhythm is the 6px it
 * puts between a label and its control. `-mt-0.5` spends the difference, so the pair reads as one
 * unit.
 */
const CAPTION_OFFSET = '-mt-0.5'

export type CreateMemeUploadPanelProps = Pick<
  CreateMemeScreenModel,
  | 'uploadImageLabel'
  | 'uploadImageHelpText'
  | 'imageFileDropProps'
  | 'uploadVideoLabel'
  | 'uploadVideoHelpText'
  | 'videoFileDropProps'
> & {
  uploadImageHelpId: string
  uploadVideoHelpId: string
}

/** Image and optional video file wells. */
export function CreateMemeUploadPanel({
  uploadImageLabel,
  uploadImageHelpText,
  imageFileDropProps,
  uploadImageHelpId,
  uploadVideoLabel,
  uploadVideoHelpText,
  videoFileDropProps,
  uploadVideoHelpId,
}: CreateMemeUploadPanelProps) {
  return (
    <div data-slot="create-meme-upload-panel" className="contents">
      <Field>
        <FieldLabel>{uploadImageLabel}</FieldLabel>
        <FileDrop {...imageFileDropProps} />
        <FieldDescription className={CAPTION_OFFSET} id={uploadImageHelpId}>
          {uploadImageHelpText}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>{uploadVideoLabel}</FieldLabel>
        <FileDrop {...videoFileDropProps} />
        <FieldDescription className={CAPTION_OFFSET} id={uploadVideoHelpId}>
          {uploadVideoHelpText}
        </FieldDescription>
      </Field>
    </div>
  )
}
