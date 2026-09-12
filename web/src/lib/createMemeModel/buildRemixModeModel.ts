import type { CreateMemeContext } from '../../stores/createMemeMachine'
import { isRemixOutput, isVideoRemixStyle } from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type RemixModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showRemixPanel'
  | 'remixSource'
  | 'remixSourceLoadingText'
  | 'remixPromptLabel'
  | 'remixPromptPlaceholder'
  | 'remixButtonLabel'
  | 'showVideoRemixStyle'
  | 'showEditedFrameApproval'
  | 'showRemixButton'
  | 'remixOutputSelectProps'
  | 'videoModeSelectProps'
  | 'remixPromptTextareaProps'
  | 'motionPromptTextareaProps'
  | 'animateEditedButtonProps'
  | 'rerunEditButtonProps'
  | 'remixButtonProps'
>

export function buildRemixModeModel(
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
  isBusy: boolean,
  showEditedFrameApproval: boolean,
): RemixModeSlice {
  const remixPromptIsPrecise = ctx.remixOutput === 'video' && ctx.videoMode === 'edit'

  return {
    showRemixPanel: ctx.mode === 'remix',
    remixSource: ctx.remixSource
      ? {
          imageProps: { src: ctx.remixSource.imageUrl, alt: ctx.remixSource.title },
          linkProps: { to: `/m/${ctx.remixSource.id}` },
          title: ctx.remixSource.title,
          creatorName: ctx.remixSource.creatorName,
        }
      : null,
    remixSourceLoadingText: 'Loading the meme you are remixing…',
    remixPromptLabel: remixPromptIsPrecise
      ? 'What to change (runs on your Masky credits)'
      : 'Edit prompt (runs on your Masky credits)',
    remixPromptPlaceholder:
      ctx.remixOutput === 'video'
        ? ctx.videoMode === 'edit'
          ? 'add a claude icon to the tshirt he is wearing'
          : 'make the whole scene look like a vaporwave painting'
        : 'same scene but everyone is a skeleton and it is raining',
    remixButtonLabel: ctx.remixOutput === 'video' ? 'Remix into video' : 'Remix image',
    showVideoRemixStyle: ctx.remixOutput === 'video' && ctx.remixSource?.mediaType === 'video',
    showEditedFrameApproval,
    showRemixButton: !showEditedFrameApproval,
    remixOutputSelectProps: {
      value: ctx.remixOutput,
      onValueChange: (value) => {
        if (value && isRemixOutput(value)) actions.setRemixOutput(value)
      },
    },
    videoModeSelectProps: {
      value: ctx.videoMode,
      onValueChange: (value) => {
        if (value && isVideoRemixStyle(value)) actions.setVideoMode(value)
      },
    },
    remixPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    motionPromptTextareaProps: {
      value: ctx.motionPrompt,
      onChange: (event) => actions.setMotionPrompt(event.currentTarget.value),
    },
    animateEditedButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.animateEdited(),
    },
    rerunEditButtonProps: {
      type: 'button',
      disabled: isBusy || !ctx.prompt.trim(),
      onClick: () => void actions.remix(),
    },
    remixButtonProps: {
      type: 'button',
      disabled: !ctx.prompt.trim() || !ctx.remixSource || isBusy,
      onClick: () => void actions.remix(),
    },
  }
}
