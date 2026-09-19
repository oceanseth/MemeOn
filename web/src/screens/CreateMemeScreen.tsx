import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/atoms/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/atoms/empty'
import {
  Field,
  FieldCounter,
  FieldDescription,
  FieldFooter,
  FieldLabel,
  Hint,
} from '@/atoms/field'
import { FileDrop } from '@/atoms/file-drop'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { Heading } from '@/atoms/heading'
import { Input } from '@/atoms/input'
import { LiveRegion } from '@/atoms/live-region'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Progress } from '@/atoms/progress'
import { Select } from '@/atoms/select'
import { SkeletonCard } from '@/atoms/skeleton'
import { Spinner } from '@/atoms/spinner'
import { Textarea } from '@/atoms/textarea'
import { TierChip } from '@/atoms/tier-chip'
import { Toolbar } from '@/atoms/toolbar'
import type {
  CreateMemeCardModel,
  CreateMemeModeButtonModel,
  CreateMemeScreenModel,
} from '../lib/createMemeModel'
import { cn } from '../lib/cn'
import { Icon } from '@/atoms/icon'

/* the mint form the user was standing on is gone at success: park focus on the outcome, not <body> */
const focusOutcome = (node: HTMLHeadingElement | null): void => node?.focus()

/** Form and preview columns; preview stacks below the form under 1000px. */
const LAYOUT =
  'grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,555fr)_minmax(0,522fr)] 2xl:gap-8'
/** the preview column sticks to the top of the scroll once the two columns split */
const RAIL = 'flex flex-col gap-4 2xl:sticky 2xl:top-[calc(var(--topbar-h)+16px)]'
const FORM_GRID = 'flex flex-col gap-3.5'
/**
 * A caption row sits 4px under its control on this form, where `Field`'s own rhythm is the 6px it
 * puts between a label and its control. `-mt-0.5` spends the difference, so the pair reads as one
 * unit; `*:mt-0` inside `FieldFooter` keeps its children from adding a second offset.
 */
const CAPTION_OFFSET = '-mt-0.5'

const MODE_ROW = 'mb-5 flex flex-wrap items-center gap-2'

/** Cost caption beside a render action. */
const COST_NOTE = 'text-sm font-semibold text-muted-foreground'
const FORM_NOTE = 'mt-1 text-xs font-medium text-muted-foreground'

const GIPHY_MARK = 'text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase'
const LOADING_STATE = 'flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-muted-foreground'

/** One source chip. The engine names the state and label; the icon stays here. */
function ModeChip({
  model,
  icon,
}: {
  model: CreateMemeModeButtonModel
  icon: ReactNode
}) {
  return (
    <Button size="segment" {...model.buttonProps} data-slot="mode-chip">
      <span aria-hidden="true">{icon}</span>{' '}
      {model.label}
    </Button>
  )
}

/* The mint preview's box model, spelled out here because the meme has no id, no link and no
   `MemeCardModel` until it is minted. FoilCard hosts the paper frame; the raised surface stays here. */
const PREVIEW_CARD = 'group relative isolate rounded-lg material-card p-2 @container'
const PREVIEW_INNER = 'relative flex h-full flex-col'
/* same plate the marketplace card uses: a square, the whole meme contained */
const PREVIEW_ART = 'block aspect-square w-full bg-muted object-contain'
const PREVIEW_META = 'flex flex-col px-1.5 pt-3.5 pb-1.5'
/** Preview title one step above the grid card size. */
const PREVIEW_TITLE = cn(
  'overflow-hidden text-ellipsis whitespace-nowrap',
  'font-display text-3xl font-normal text-foreground',
  'max-md:text-xl',
)
const PREVIEW_TIER_ROW = 'mt-1.5 flex items-center gap-2'
const PREVIEW_TIER_NOTE = 'text-sm font-semibold text-muted-foreground'
/** The plate the card will land on, at the card's own frame geometry. */
const PREVIEW_PLACEHOLDER = cn(
  'flex aspect-square items-center justify-center rounded-lg material-pressed',
  'text-sm font-medium text-muted-foreground',
)
const PREVIEW_SUB = cn(
  'mt-3 flex items-center justify-between gap-2 text-sm font-semibold text-muted-foreground tabular-nums',
  '@max-card-narrow:flex-wrap @max-card-narrow:gap-y-0.5',
)

/** The meme as it will ship, assembled while you type. */
function PreviewCard({ card }: { card: CreateMemeCardModel }) {
  const tierSuffix = card.tierLabel.startsWith(`${card.tierName} · `)
    ? card.tierLabel.slice(card.tierName.length + 3)
    : card.tierLabel

  return (
    <FoilCard data-slot="meme-card" tierKey="paper" className={PREVIEW_CARD}>
      <div data-slot="meme-card-inner" className={PREVIEW_INNER}>
        <FoilMedia>
          {card.media.kind === 'video' ? (
            <video
              data-slot="meme-art"
              className={PREVIEW_ART}
              {...card.media.videoProps}
            />
          ) : (
            <img data-slot="meme-art" className={PREVIEW_ART} {...card.media.imageProps} />
          )}
        </FoilMedia>
        <div data-slot="meme-meta" className={PREVIEW_META}>
          <span data-slot="meme-title" className={PREVIEW_TITLE}>
            {card.title}
          </span>
          <span data-slot="tier-note" className={PREVIEW_TIER_ROW}>
            <TierChip tierKey="paper" label={card.tierName} size="sm" />
            <span className={PREVIEW_TIER_NOTE}>{tierSuffix}</span>
          </span>
          <span data-slot="meme-sub" className={PREVIEW_SUB}>
            <span className="inline-flex items-center gap-0.5">
              <span aria-hidden="true">
                <Icon name="eye" size={14} />
              </span>{' '}
              {card.statsLabel}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <span aria-hidden="true">
                <Icon name="brain" size={14} />
              </span>{' '}
              {card.valueLabel}
            </span>
          </span>
        </div>
      </div>
    </FoilCard>
  )
}

/** Mint form as a function of its model. Every engine state is one set of args. */
export function CreateMemeScreen({
  pageTitle,
  pageSubtitle,
  formHeading,
  formDescription,
  titleLabel,
  tagsLabel,
  promptLabel,
  creditsNote,
  titleFooter,
  toMintPrefix,
  sharesToYou,
  mintLabel,
  shareLinkLabel,
  openCardLabel,
  busyHoldText,
  previewHeading,
  previewDescription,
  previewPlaceholder,
  showRemixModeButton,
  modeGroupProps,
  busy,
  busyElapsedLabel,
  err,
  errorNextStep,
  remixSource,
  remixSourceLoadingText,
  remixingPrefix,
  remixingBy,
  remixOutputLabel,
  videoRemixStyleLabel,
  approvalTitle,
  approvalBody,
  motionLabel,
  motionPromptPlaceholder,
  animateEditedLabel,
  rerunEditLabel,
  giphyResults,
  giphyPick,
  giphyStatusText,
  giphyStatusHidden,
  giphyCategoryLabel,
  giphySearchLabel,
  giphyQueryPlaceholder,
  giphySearchButtonLabel,
  giphyPoweredBy,
  giphySelectedPrefix,
  giphyPickSuffix,
  giphyOptionalPromptLabel,
  giphyRemixPlaceholder,
  giphyRemixButtonLabel,
  remixPromptLabel,
  remixPromptPlaceholder,
  generatePromptPlaceholder,
  generatePromptHelpText,
  remixButtonLabel,
  generateButtonLabel,
  fetchUrlButtonLabel,
  urlFieldLabel,
  urlOptionalPromptLabel,
  urlRemixPlaceholder,
  applyUrlEditLabel,
  mintHint,
  titlePlaceholder,
  titleHelpText,
  titleCounterLabel,
  tagsPlaceholder,
  tagsHelpText,
  tagsCounterLabel,
  urlPlaceholder,
  urlHelpText,
  uploadImageLabel,
  uploadImageHelpText,
  uploadVideoLabel,
  uploadVideoHelpText,
  helpIds,
  showRemixPanel,
  showGiphyPanel,
  showUrlPanel,
  showUploadPanel,
  showGeneratePanel,
  showVideoRemixStyle,
  showEditedFrameApproval,
  showRemixButton,
  showGiphyResults,
  showGiphyPick,
  showGiphyRemixButton,
  showUrlApplyEdit,
  showBusy,
  showErr,
  showPreviewCard,
  showPreviewSkeleton,
  showMintHint,
  showSuccess,
  formProps,
  getModeButtonProps,
  titleInputProps,
  tagsInputProps,
  remixOutputSelectProps,
  videoModeSelectProps,
  remixPromptTextareaProps,
  motionPromptTextareaProps,
  animateEditedButtonProps,
  rerunEditButtonProps,
  remixButtonProps,
  giphyCategorySelectProps,
  giphyQueryInputProps,
  giphySearchButtonProps,
  getGiphyResultProps,
  giphyPromptTextareaProps,
  applyGiphyEditButtonProps,
  urlInputProps,
  fetchUrlButtonProps,
  urlPromptTextareaProps,
  applyUrlEditButtonProps,
  imageFileDropProps,
  videoFileDropProps,
  generatePromptTextareaProps,
  generateButtonProps,
  mintButtonProps,
  busyNoticeProps,
  errorNoticeProps,
  giphyStatusProps,
  previewCard,
  successCard,
  mintStatus,
  successHeading,
  successBody,
  copyShareLinkLabel,
  copyShareLinkButtonProps,
  shareUrlInputProps,
  openMintedLinkProps,
}: CreateMemeScreenModel) {
  if (showSuccess) {
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        {/* the outcome heading is the focus target, so it is written here rather than via PageHead */}
        <div data-slot="page-head" className="mx-0 mt-5 mb-6">
          <Heading size="display" tabIndex={-1} ref={focusOutcome}>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true">
                <Icon name="brain" size={28} />
              </span>{' '}
              {successHeading}
            </span>
          </Heading>
        </div>
        <div className="sr-only" role="status">{mintStatus}</div>
        <div className={LAYOUT}>
          <div className={RAIL}>
            <PreviewCard card={successCard} />
          </div>
          <Card className="flex flex-col gap-3.5">
            <CardDescription>{successBody}</CardDescription>
            <Field>
              <FieldLabel>{shareLinkLabel}</FieldLabel>
              <Input {...shareUrlInputProps} />
            </Field>
            <Toolbar>
              <Link className={buttonVariants({ variant: 'primary' })} {...openMintedLinkProps}>
                {openCardLabel}
              </Link>
              <Button {...copyShareLinkButtonProps}>
                <span aria-hidden="true">
                  <Icon name="link" size={16} />
                </span>{' '}
                {copyShareLinkLabel}
              </Button>
            </Toolbar>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead title={pageTitle} subtitle={pageSubtitle} />
      <div className="sr-only" role="status">{mintStatus}</div>

      {/* the source row sits above both columns, the full width of the content column */}
      <div data-slot="mint-modes" className={MODE_ROW} {...modeGroupProps}>
        {showRemixModeButton && (
          <ModeChip model={getModeButtonProps('remix')} icon={<Icon name="dna" size={16} />} />
        )}
        <ModeChip model={getModeButtonProps('generate')} icon={<Icon name="palette" size={16} />} />
        <ModeChip model={getModeButtonProps('video')} icon={<Icon name="clapperboard" size={16} />} />
        <ModeChip model={getModeButtonProps('upload')} icon={<Icon name="upload" size={16} />} />
        <ModeChip model={getModeButtonProps('giphy')} icon={<Icon name="film" size={16} />} />
        <ModeChip model={getModeButtonProps('url')} icon={<Icon name="link" size={16} />} />
      </div>

      <div className={LAYOUT}>
        <Card>
          <CardHeader>
            <CardTitle size="card-title">{formHeading}</CardTitle>
            <CardDescription>{formDescription}</CardDescription>
          </CardHeader>
          <div data-slot="form-grid" className={cn(FORM_GRID, 'mt-5')} {...formProps}>
            <Field>
              <FieldLabel>{titleLabel}</FieldLabel>
              <Input {...titleInputProps} placeholder={titlePlaceholder} />
              <FieldFooter className={CAPTION_OFFSET}>
                <FieldDescription id={helpIds.title}>{titleHelpText}</FieldDescription>
                <FieldCounter>{titleCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            <Field>
              <FieldLabel>{tagsLabel}</FieldLabel>
              <Input {...tagsInputProps} placeholder={tagsPlaceholder} />
              <FieldFooter className={CAPTION_OFFSET}>
                <FieldDescription id={helpIds.tags}>{tagsHelpText}</FieldDescription>
                <FieldCounter>{tagsCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            {showRemixPanel ? (
              <>
                {remixSource ? (
                  <Toolbar>
                    <img
                      {...remixSource.imageProps}
                      className="size-21 rounded-md object-cover"
                    />
                    <Hint as="span">
                      {remixingPrefix}{' '}
                      <Link {...remixSource.linkProps}>"{remixSource.title}"</Link>
                      {remixingBy}
                      {remixSource.creatorName}
                    </Hint>
                  </Toolbar>
                ) : (
                  <div className={LOADING_STATE} role="status">
                    <Spinner />
                    {remixSourceLoadingText}
                  </div>
                )}
                <Field>
                  <FieldLabel>{remixOutputLabel}</FieldLabel>
                  <Select aria-label={remixOutputLabel} {...remixOutputSelectProps} />
                </Field>
                {showVideoRemixStyle && (
                  <Field>
                    <FieldLabel>{videoRemixStyleLabel}</FieldLabel>
                    <Select aria-label={videoRemixStyleLabel} {...videoModeSelectProps} />
                  </Field>
                )}
                <Field>
                  <FieldLabel>{remixPromptLabel}</FieldLabel>
                  <Textarea
                    {...remixPromptTextareaProps}
                    rows={3}
                    placeholder={remixPromptPlaceholder}
                  />
                </Field>
                {showEditedFrameApproval && (
                  /* wrapper keeps the named slot the atom would otherwise own.
                     role="none" — panel live region already announces this turn */
                  <div data-slot="approval-card">
                    <Empty variant="success" size="inline" role="none">
                      <EmptyHeader>
                        <EmptyTitle>
                          <span aria-hidden="true">
                            <Icon name="circle-check" size={18} />
                          </span>{' '}
                          {approvalTitle}
                        </EmptyTitle>
                        <EmptyDescription>{approvalBody}</EmptyDescription>
                      </EmptyHeader>
                      <Field className="w-full">
                        <FieldLabel>{motionLabel}</FieldLabel>
                        <Textarea
                          {...motionPromptTextareaProps}
                          rows={3}
                          placeholder={motionPromptPlaceholder}
                        />
                      </Field>
                      <Toolbar>
                        <Button variant="primary" {...animateEditedButtonProps}>
                          <span aria-hidden="true">
                            <Icon name="clapperboard" size={16} />
                          </span>{' '}
                          {animateEditedLabel}
                        </Button>
                        <Button {...rerunEditButtonProps}>
                          <span aria-hidden="true">
                            <Icon name="rotate-cw" size={16} />
                          </span>{' '}
                          {rerunEditLabel}
                        </Button>
                      </Toolbar>
                    </Empty>
                  </div>
                )}
                {showRemixButton && (
                  <Toolbar className="mt-1">
                    <Button variant="primary" {...remixButtonProps}>
                      {remixButtonLabel}
                    </Button>
                    <span className={COST_NOTE}>{creditsNote}</span>
                  </Toolbar>
                )}
              </>
            ) : showGiphyPanel ? (
              <>
                <Field>
                  <FieldLabel>{giphyCategoryLabel}</FieldLabel>
                  <Select aria-label={giphyCategoryLabel} {...giphyCategorySelectProps} />
                </Field>
                <Field>
                  <FieldLabel>{giphySearchLabel}</FieldLabel>
                  <Input {...giphyQueryInputProps} placeholder={giphyQueryPlaceholder} />
                </Field>
                <Toolbar>
                  <Button {...giphySearchButtonProps}>{giphySearchButtonLabel}</Button>
                  <span className={GIPHY_MARK}>{giphyPoweredBy}</span>
                </Toolbar>

                {showGiphyResults && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
                    {giphyResults.map((g) => {
                      const cell = getGiphyResultProps(g)
                      return (
                        <Button key={g.id} variant="cell" size="cell" pressed={cell.picked} {...cell.buttonProps}>
                          <img {...cell.imageProps} className="block h-full w-full object-cover" />
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* one live region for the panel: the chrome swaps, the element never remounts.
                    The card is never restyled away — the wrapper takes it off screen instead. */}
                <div className={cn(giphyStatusHidden && 'sr-only')}>
                  <Empty className="py-8" {...giphyStatusProps}>
                    <EmptyDescription>{giphyStatusText}</EmptyDescription>
                  </Empty>
                </div>

                {showGiphyPick && giphyPick && (
                  <>
                    <Hint className="mb-2">
                      {giphySelectedPrefix} <strong>{giphyPick.title}</strong>
                      {giphyPick.authorLabel} {giphyPickSuffix}
                    </Hint>
                    <Field>
                      <FieldLabel>{giphyOptionalPromptLabel}</FieldLabel>
                      <Textarea
                        {...giphyPromptTextareaProps}
                        rows={2}
                        placeholder={giphyRemixPlaceholder}
                      />
                    </Field>
                    {showGiphyRemixButton && (
                      <Toolbar className="mt-1">
                        <Button variant="primary" {...applyGiphyEditButtonProps}>
                          <Icon name="sparkles" size={16} /> {giphyRemixButtonLabel}
                        </Button>
                        <span className={COST_NOTE}>{creditsNote}</span>
                      </Toolbar>
                    )}
                  </>
                )}
              </>
            ) : showUrlPanel ? (
              <>
                <Field>
                  <FieldLabel>{urlFieldLabel}</FieldLabel>
                  <Input {...urlInputProps} placeholder={urlPlaceholder} />
                  <FieldDescription className={CAPTION_OFFSET} id={helpIds.url}>
                    {urlHelpText}
                  </FieldDescription>
                </Field>
                <div>
                  <Button {...fetchUrlButtonProps}>{fetchUrlButtonLabel}</Button>
                </div>
                <Field>
                  <FieldLabel>{urlOptionalPromptLabel}</FieldLabel>
                  <Textarea
                    {...urlPromptTextareaProps}
                    rows={2}
                    placeholder={urlRemixPlaceholder}
                  />
                </Field>
                {showUrlApplyEdit && (
                  <Toolbar className="mt-1">
                    <Button variant="primary" {...applyUrlEditButtonProps}>
                      <Icon name="sparkles" size={16} /> {applyUrlEditLabel}
                    </Button>
                    <span className={COST_NOTE}>{creditsNote}</span>
                  </Toolbar>
                )}
              </>
            ) : showUploadPanel ? (
              <>
                <Field>
                  <FieldLabel>{uploadImageLabel}</FieldLabel>
                  <FileDrop {...imageFileDropProps} />
                  <FieldDescription className={CAPTION_OFFSET} id={helpIds.uploadImage}>
                    {uploadImageHelpText}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>{uploadVideoLabel}</FieldLabel>
                  <FileDrop {...videoFileDropProps} />
                  <FieldDescription className={CAPTION_OFFSET} id={helpIds.uploadVideo}>
                    {uploadVideoHelpText}
                  </FieldDescription>
                </Field>
              </>
            ) : showGeneratePanel ? (
              <>
                <Field>
                  <FieldLabel>{promptLabel}</FieldLabel>
                  <Textarea
                    {...generatePromptTextareaProps}
                    rows={3}
                    placeholder={generatePromptPlaceholder}
                  />
                  <FieldDescription className={CAPTION_OFFSET} id={helpIds.prompt}>
                    {generatePromptHelpText}
                  </FieldDescription>
                </Field>
                <Toolbar className="mt-1">
                  <Button variant="primary" {...generateButtonProps}>
                    {generateButtonLabel}
                  </Button>
                  <span className={COST_NOTE}>{creditsNote}</span>
                </Toolbar>
              </>
            ) : null}

            {/* both regions are mounted in every state and only their text swaps: a live region
                inserted together with its content is commonly missed */}
            <LiveRegion variant="visible" className="not-empty:mb-4" {...busyNoticeProps}>
              {showBusy && (
                /* the region is the live one; a second status role here would announce twice */
                <div data-slot="busy-card">
                  <Empty variant="busy" size="inline" role="none">
                    <EmptyHeader>
                      <EmptyTitle>
                        {busy}
                        {busyElapsedLabel && <FieldCounter>{busyElapsedLabel}</FieldCounter>}
                      </EmptyTitle>
                    </EmptyHeader>
                    {/* the render has no percentage to report: an indeterminate meter */}
                    <Progress value={null} aria-hidden="true" className="w-full" />
                    <EmptyDescription>{busyHoldText}</EmptyDescription>
                  </Empty>
                </div>
              )}
            </LiveRegion>
            <LiveRegion variant="visible" className="not-empty:mb-4" {...errorNoticeProps}>
              {showErr && (
                <Alert variant="error" role="none" className="mt-3">
                  <span aria-hidden="true">
                    <Icon name="triangle-alert" size={16} />
                  </span>{' '}
                  {err}
                  {errorNextStep && <Hint as="span">{errorNextStep}</Hint>}
                </Alert>
              )}
            </LiveRegion>

            <p className={FORM_NOTE}>{titleFooter}</p>
          </div>
        </Card>

        <div className={RAIL}>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle size="card-title">{previewHeading}</CardTitle>
              <CardDescription>{previewDescription}</CardDescription>
            </CardHeader>
            <div className="mt-5 flex flex-col gap-3">
              {/* placeholder keeps the preview column's silhouette before a card exists */}
              {!showPreviewCard && !showPreviewSkeleton && (
                <div data-slot="preview-placeholder" className={PREVIEW_PLACEHOLDER}>
                  {previewPlaceholder}
                </div>
              )}
              {showPreviewSkeleton && <SkeletonCard />}
              {showPreviewCard && (
                <>
                  <PreviewCard card={previewCard} />
                  {previewCard.originLabel && <Hint className="mt-0">{previewCard.originLabel}</Hint>}
                </>
              )}
              {showMintHint && <Hint className="mt-0">{toMintPrefix} {mintHint}</Hint>}
            </div>
            {/* phone: shares line above a full-width Mint pill */}
            <div className="mt-4 flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch max-md:gap-2">
              <span className="text-sm font-semibold text-foreground max-md:font-medium max-md:text-muted-foreground">
                {sharesToYou}
              </span>
              <Button variant="primary" className="max-md:w-full" {...mintButtonProps}>
                <Icon name="sparkles" size={16} /> {mintLabel}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
