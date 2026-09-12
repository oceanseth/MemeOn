import type { CreateMemeContext, CreateMemePhase } from '../../stores/createMemeMachine'
import { buildCommonModel } from './buildCommonModel'
import { buildGenerateModeModel } from './buildGenerateModeModel'
import { buildGiphyModeModel } from './buildGiphyModeModel'
import { buildRemixModeModel } from './buildRemixModeModel'
import { buildUploadModeModel } from './buildUploadModeModel'
import { buildUrlModeModel } from './buildUrlModeModel'
import { deriveMintState } from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

/** Builds the terminal contract from machine state and domain actions. */
export function buildCreateMemeScreenModel(
  phase: CreateMemePhase,
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
): CreateMemeScreenModel {
  const isBusy = !!ctx.busy
  const { canMint, mintHint } = deriveMintState(ctx, isBusy)
  const showEditedFrameApproval =
    ctx.remixOutput === 'video' && ctx.videoMode === 'edit' && !!ctx.editedFrame && !ctx.videoUrl

  return {
    ...buildCommonModel(phase, ctx, actions, isBusy, canMint, mintHint),
    ...buildRemixModeModel(ctx, actions, isBusy, showEditedFrameApproval),
    ...buildGiphyModeModel(ctx, actions, isBusy),
    ...buildUrlModeModel(ctx, actions, isBusy),
    ...buildUploadModeModel(ctx, actions),
    ...buildGenerateModeModel(ctx, actions, isBusy),
  }
}
