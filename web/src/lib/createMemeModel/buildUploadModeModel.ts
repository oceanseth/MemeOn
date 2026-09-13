import { createMemeCopy as copy } from '../../copy/createMeme'
import type { CreateMemeContext } from '../../stores/createMemeMachine'
import {
  firstFile,
  HELP_IDS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  megabyteLabel,
} from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type UploadModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showUploadPanel'
  | 'uploadImageHelpText'
  | 'uploadVideoHelpText'
  | 'imageFileInputProps'
  | 'uploadImageLabel'
  | 'videoFileInputProps'
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
    imageFileInputProps: {
      type: 'file',
      accept: 'image/png,image/jpeg,image/gif,image/webp',
      'aria-describedby': HELP_IDS.uploadImage,
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadImage(file)
      },
    },
    uploadImageLabel: copy.upload.imageLabel,
    videoFileInputProps: {
      type: 'file',
      accept: 'video/mp4,video/quicktime,video/webm',
      'aria-describedby': HELP_IDS.uploadVideo,
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadVideo(file)
      },
    },
    uploadVideoLabel: copy.upload.videoLabel,
  }
}
