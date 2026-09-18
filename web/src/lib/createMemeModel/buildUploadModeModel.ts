import { createMemeCopy as copy } from '../../copy/createMeme'
import type { CreateMemeContext } from '../../stores/createMemeMachine'
import { HELP_IDS, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, megabyteLabel } from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type UploadModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showUploadPanel'
  | 'uploadImageHelpText'
  | 'uploadVideoHelpText'
  | 'imageFileDropProps'
  | 'uploadImageLabel'
  | 'videoFileDropProps'
  | 'uploadVideoLabel'
>

export function buildUploadModeModel(
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
): UploadModeSlice {
  return {
    showUploadPanel: ctx.mode === 'upload',
    uploadImageHelpText: copy.upload.imageHelp(megabyteLabel(MAX_IMAGE_BYTES)),
    uploadVideoHelpText: copy.upload.videoHelp(megabyteLabel(MAX_VIDEO_BYTES)),
    imageFileDropProps: {
      accept: 'image/png,image/jpeg,image/gif,image/webp',
      chooseLabel: copy.upload.chooseImage,
      emptyLabel: copy.upload.dropHint,
      fileName: ctx.imageFileName,
      'aria-describedby': HELP_IDS.uploadImage,
      onFile: (file) => void actions.uploadImage(file),
    },
    uploadImageLabel: copy.upload.imageLabel,
    videoFileDropProps: {
      accept: 'video/mp4,video/quicktime,video/webm',
      chooseLabel: copy.upload.chooseVideo,
      emptyLabel: copy.upload.dropHint,
      fileName: ctx.videoFileName,
      'aria-describedby': HELP_IDS.uploadVideo,
      onFile: (file) => void actions.uploadVideo(file),
    },
    uploadVideoLabel: copy.upload.videoLabel,
  }
}
