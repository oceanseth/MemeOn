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
    generatePromptPlaceholder: 'a capybara in a business suit ignoring a burning office, cinematic',
    generatePromptHelpText:
      'Describe the whole scene — subject, style, chaos level. Runs on your Masky credits.',
    generateButtonLabel: ctx.mode === 'video' ? 'Render the video' : 'Render the image',
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
