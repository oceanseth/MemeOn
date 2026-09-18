import { createMemeCopy as copy } from '../../copy/createMeme'
import type { CreateMemeContext } from '../../stores/createMemeMachine'
import { HELP_IDS } from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type UrlModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showUrlPanel'
  | 'urlPlaceholder'
  | 'urlHelpText'
  | 'showUrlApplyEdit'
  | 'fetchUrlButtonLabel'
  | 'urlInputProps'
  | 'fetchUrlButtonProps'
  | 'urlPromptTextareaProps'
  | 'applyUrlEditButtonProps'
>

export function buildUrlModeModel(
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
  isBusy: boolean,
): UrlModeSlice {
  return {
    showUrlPanel: ctx.mode === 'url',
    urlPlaceholder: 'https://…/meme.png',
    urlHelpText: copy.url.help,
    showUrlApplyEdit: !!ctx.prompt.trim() && !!ctx.imageUrl && !ctx.edited,
    fetchUrlButtonLabel: copy.url.fetch,
    urlInputProps: {
      type: 'url',
      value: ctx.urlDraft,
      'aria-describedby': HELP_IDS.url,
      onChange: (event) => actions.setUrl(event.currentTarget.value),
      onBlur: () => void actions.resolvePageUrl(),
      onKeyDown: (event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void actions.resolvePageUrl()
      },
    },
    fetchUrlButtonProps: {
      type: 'button',
      disabled: !ctx.urlDraft.trim() || isBusy,
      onClick: () => void actions.resolvePageUrl(),
    },
    urlPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    applyUrlEditButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.applyUrlEdit(),
    },
  }
}
