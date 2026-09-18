import { createMemeCopy as copy } from '../../copy/createMeme'
import type { CreateMemeContext } from '../../stores/createMemeMachine'
import { HELP_IDS } from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type GenerateModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showGeneratePanel'
  | 'generatePromptPlaceholder'
  | 'generatePromptHelpText'
  | 'generateButtonLabel'
  | 'generatePromptTextareaProps'
  | 'generateButtonProps'
>

export function buildGenerateModeModel(
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
  isBusy: boolean,
): GenerateModeSlice {
  return {
    showGeneratePanel: ctx.mode === 'generate' || ctx.mode === 'video',
    generatePromptPlaceholder: copy.generate.promptPlaceholder,
    generatePromptHelpText: copy.generate.promptHelp,
    generateButtonLabel: ctx.mode === 'video' ? copy.generate.renderVideo : copy.generate.renderImage,
    generatePromptTextareaProps: {
      value: ctx.prompt,
      'aria-describedby': HELP_IDS.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    generateButtonProps: {
      type: 'button',
      disabled: !ctx.prompt.trim() || isBusy,
      onClick: () => void actions.generate(),
    },
  }
}
