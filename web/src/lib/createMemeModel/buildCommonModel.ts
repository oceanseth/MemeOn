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
    showRemixModeButton: !!ctx.remixId,
    modeGroupProps: { role: 'group', 'aria-label': 'Source' },
    busy: ctx.busy,
    busyElapsedLabel: ctx.busyElapsed,
    err: ctx.err,
    errorNextStep: nextStepFor(ctx.err),
    mintHint,
    titlePlaceholder: 'e.g. cursed capybara',
    titleHelpText: `Up to ${TITLE_MAX} characters — it has to fit the card banner.`,
    titleCounterLabel: `${countTitle(ctx.title)} / ${TITLE_MAX}`,
    tagsPlaceholder: 'animals, chaos',
    tagsHelpText: `Up to ${TAGS_MAX} tags, comma-separated — this is how people find it.`,
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
          ? 'Share link copied to your clipboard.'
          : 'Minted. Your card is live and the share link is ready.'
        : '',
    successHeading: '🧠 Minted. It is live.',
    successBody:
      'All 100 shares are yours. Send the link — every reshare pushes the card up the tier ladder.',
    copyShareLinkLabel: ctx.shareCopied ? 'Copied ✓' : '🔗 Copy share link',
    copyShareLinkButtonProps: {
      type: 'button',
      onClick: () => void actions.copyShareLink(),
    },
    shareUrlInputProps: { value: ctx.shareUrl, readOnly: true, 'aria-label': 'Share link' },
    openMintedLinkProps: { to: `/m/${ctx.mintedId ?? ''}` },
  }
}
