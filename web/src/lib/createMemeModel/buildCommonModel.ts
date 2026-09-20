import { createMemeCopy as copy } from '../../copy/createMeme'
import type { CreateMemeContext, CreateMemeMode, CreateMemePhase } from '../../stores/createMemeMachine'
import {
  boundTags,
  boundTitle,
  buildCard,
  countTags,
  countTitle,
  HELP_IDS,
  nextStepFor,
  TAGS_MAX,
  TITLE_MAX,
} from './shared'
import type { CreateMemeScreenActions, CreateMemeScreenModel } from './types'

type CommonSlice = Pick<
  CreateMemeScreenModel,
  | 'phase'
  | 'mode'
  | 'pageTitle'
  | 'pageSubtitle'
  | 'formHeading'
  | 'formDescription'
  | 'titleLabel'
  | 'tagsLabel'
  | 'creditsNote'
  | 'titleFooter'
  | 'toMintPrefix'
  | 'sharesToYou'
  | 'mintLabel'
  | 'shareLinkLabel'
  | 'openCardLabel'
  | 'busyHoldText'
  | 'previewHeading'
  | 'previewDescription'
  | 'previewPlaceholder'
  | 'showRemixModeButton'
  | 'modeGroupProps'
  | 'busy'
  | 'busyElapsedLabel'
  | 'err'
  | 'errorNextStep'
  | 'mintHint'
  | 'titlePlaceholder'
  | 'titleHelpText'
  | 'titleCounterLabel'
  | 'tagsPlaceholder'
  | 'tagsHelpText'
  | 'tagsCounterLabel'
  | 'helpIds'
  | 'showBusy'
  | 'showErr'
  | 'showPreviewCard'
  | 'showPreviewSkeleton'
  | 'showMintHint'
  | 'showSuccess'
  | 'formProps'
  | 'getModeButtonProps'
  | 'titleInputProps'
  | 'tagsInputProps'
  | 'mintButtonProps'
  | 'busyNoticeProps'
  | 'errorNoticeProps'
  | 'previewCard'
  | 'successCard'
  | 'mintStatus'
  | 'successHeading'
  | 'successBody'
  | 'shareCopied'
  | 'copyShareLinkLabel'
  | 'copyShareLinkButtonProps'
  | 'shareUrlInputProps'
  | 'openMintedLinkProps'
>

export function buildCommonModel(
  phase: CreateMemePhase,
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
  isBusy: boolean,
  canMint: boolean,
  mintHint: string,
): CommonSlice {
  return {
    phase,
    mode: ctx.mode,
    pageTitle: copy.page.title,
    pageSubtitle: copy.page.subtitle,
    formHeading: copy.form.heading[ctx.mode],
    formDescription: copy.form.description,
    titleLabel: copy.form.titleLabel,
    tagsLabel: copy.form.tagsLabel,
    creditsNote: copy.form.creditsNote,
    titleFooter: copy.form.titleFooter(TITLE_MAX),
    toMintPrefix: copy.form.toMint,
    sharesToYou: copy.form.sharesToYou,
    mintLabel: copy.form.mint,
    shareLinkLabel: copy.form.success.shareLink,
    openCardLabel: copy.form.success.openCard,
    busyHoldText: copy.preview.busyHold,
    previewHeading: copy.preview.heading,
    previewDescription: copy.preview.description,
    previewPlaceholder: copy.preview.placeholder,
    showRemixModeButton: !!ctx.remixId,
    modeGroupProps: { role: 'group', 'aria-label': copy.form.sourceGroup },
    busy: ctx.busy,
    busyElapsedLabel: ctx.busyElapsed,
    err: ctx.err,
    errorNextStep: nextStepFor(ctx.err),
    mintHint,
    titlePlaceholder: copy.form.titlePlaceholder,
    titleHelpText: copy.form.titleHelp(TITLE_MAX),
    titleCounterLabel: `${countTitle(ctx.title)} / ${TITLE_MAX}`,
    tagsPlaceholder: copy.form.tagsPlaceholder,
    tagsHelpText: copy.form.tagsHelp(TAGS_MAX),
    tagsCounterLabel: `${countTags(ctx.tags)} / ${TAGS_MAX}`,
    helpIds: HELP_IDS,
    showBusy: isBusy,
    showErr: !!ctx.err,
    showPreviewCard: !!ctx.imageUrl || !!ctx.videoUrl,
    showPreviewSkeleton: isBusy && !ctx.imageUrl && !ctx.videoUrl,
    showMintHint: !canMint && !isBusy,
    showSuccess: phase === 'success',
    formProps: { 'aria-busy': isBusy },
    getModeButtonProps: (candidate: CreateMemeMode) => ({
      selected: ctx.mode === candidate,
      label: copy.modes[candidate],
      buttonProps: {
        type: 'button',
        'aria-pressed': ctx.mode === candidate,
        disabled: isBusy,
        onClick: () => actions.selectMode(candidate),
      },
    }),
    titleInputProps: {
      id: 'create-title',
      value: ctx.title,
      'aria-describedby': HELP_IDS.title,
      onChange: (event) => actions.setTitle(boundTitle(event.currentTarget.value)),
    },
    tagsInputProps: {
      value: ctx.tags,
      maxLength: 80,
      'aria-describedby': HELP_IDS.tags,
      onChange: (event) => actions.setTags(boundTags(event.currentTarget.value)),
    },
    mintButtonProps: {
      type: 'button',
      disabled: !canMint,
      onClick: () => void actions.mint(),
    },
    busyNoticeProps: { role: 'status', 'aria-live': 'polite' },
    errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' },
    previewCard: buildCard(ctx),
    successCard: buildCard(ctx),
    mintStatus:
      phase === 'success'
        ? ctx.shareCopied
          ? copy.form.success.copied
          : copy.form.success.minted
        : '',
    successHeading: copy.form.success.heading,
    successBody: copy.form.success.body,
    shareCopied: ctx.shareCopied,
    copyShareLinkLabel: ctx.shareCopied ? copy.form.copied : copy.form.success.copyLink,
    copyShareLinkButtonProps: {
      type: 'button',
      onClick: () => void actions.copyShareLink(),
    },
    shareUrlInputProps: { value: ctx.shareUrl, readOnly: true, 'aria-label': copy.form.success.shareLink },
    openMintedLinkProps: { to: `/m/${ctx.mintedId ?? ''}` },
  }
}
