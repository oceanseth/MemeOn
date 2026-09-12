import type { CreateMemeContext } from '../../stores/createMemeMachine'
import type { GiphyResult } from '../types'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type GiphyModeSlice = Pick<
  CreateMemeScreenModel,
  | 'showGiphyPanel'
  | 'giphyCategories'
  | 'giphyResults'
  | 'giphyPick'
  | 'giphyStatusText'
  | 'showGiphyResults'
  | 'showGiphyPick'
  | 'showGiphyRemixButton'
  | 'giphyStatusHidden'
  | 'giphyCategorySelectProps'
  | 'giphyQueryInputProps'
  | 'giphySearchButtonProps'
  | 'getGiphyResultProps'
  | 'giphyPromptTextareaProps'
  | 'applyGiphyEditButtonProps'
  | 'giphyStatusProps'
>

export function buildGiphyModeModel(
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
  isBusy: boolean,
): GiphyModeSlice {
  return {
    showGiphyPanel: ctx.mode === 'giphy',
    giphyCategories: ctx.giphyCategories,
    giphyResults: ctx.giphyResults,
    giphyPick: ctx.giphyPick
      ? {
          title: ctx.giphyPick.title,
          authorLabel: ctx.giphyPick.author ? ` (@${ctx.giphyPick.author})` : null,
        }
      : null,
    giphyStatusText:
      ctx.giphyResults.length > 0
        ? `${ctx.giphyResults.length} GIPHY results for "${ctx.giphyQuery}"`
        : ctx.giphySearched
          ? `Nothing for "${ctx.giphyQuery}" — try a broader word or pick a category.`
          : 'Pick a category or search to browse GIPHY.',
    showGiphyResults: ctx.giphyResults.length > 0,
    showGiphyPick: !!ctx.giphyPick,
    showGiphyRemixButton: !!ctx.prompt.trim() && !!ctx.giphyPick,
    giphyStatusHidden: ctx.giphyResults.length > 0,
    giphyCategorySelectProps: {
      value: '',
      disabled: isBusy,
      onValueChange: (value) => {
        if (value) void actions.searchGiphy(value)
      },
    },
    giphyQueryInputProps: {
      type: 'search',
      value: ctx.giphyQuery,
      onChange: (event) => actions.setGiphyQuery(event.currentTarget.value),
      onKeyDown: (event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void actions.searchGiphy(ctx.giphyQuery)
      },
    },
    giphySearchButtonProps: {
      type: 'button',
      disabled: !ctx.giphyQuery.trim() || isBusy,
      onClick: () => void actions.searchGiphy(ctx.giphyQuery),
    },
    getGiphyResultProps: (result: GiphyResult) => {
      const picked = ctx.giphyPick?.id === result.id
      return {
        picked,
        buttonProps: {
          type: 'button',
          'aria-pressed': picked,
          onClick: () => actions.pickGiphy(result),
        },
        imageProps: {
          src: picked ? result.gifUrl : result.stillUrl,
          alt: result.title,
          loading: 'lazy',
          decoding: 'async',
        },
      }
    },
    giphyPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    applyGiphyEditButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.applyGiphyEdit(),
    },
    giphyStatusProps: { role: 'status' },
  }
}
