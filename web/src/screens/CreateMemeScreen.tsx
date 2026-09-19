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
import { Select, type SelectOption } from '@/atoms/select'
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
import type { CreateMemeMode } from '../stores/createMemeMachine'
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
/* option copy is words, so it lives here with the rest of them; the model only carries the value */
const REMIX_OUTPUT_OPTIONS: SelectOption[] = [
  { value: 'image', label: 'New image (edit the art)' },
  { value: 'video', label: 'New video' },
]
const VIDEO_REMIX_STYLE_OPTIONS: SelectOption[] = [
  { value: 'edit', label: 'Precise edit (change something, then animate)' },
  { value: 'restyle', label: 'Restyle the whole video (transforms the look)' },
]
/* the browse row reads as its own prompt, so the resting value is a real option, not a placeholder */
const GIPHY_BROWSE_OPTION: SelectOption = { value: '', label: 'Browse categories…' }
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

/* a `Select` inside a `Field` names its trigger but not its listbox (LEDGER L14): the label copy
   is written once and passed to both. */
const OUTPUT_LABEL = 'Output'
const VIDEO_STYLE_LABEL = 'Video remix style'
const CATEGORY_LABEL = 'Category'

/** The form card's own headline per source — the copy deck's "Make a fresh image" and its siblings. */
const FORM_HEADING: Record<CreateMemeMode, string> = {
  generate: 'Make a fresh image',
  video: 'Make a fresh video',
  remix: 'Remix a card that already works',
  upload: 'Bring your own art',
  giphy: 'Borrow something from GIPHY',
  url: 'Pull it in off the web',
}

/** One source chip. The engine names the state; the chrome for that state lives here. */
function ModeChip({
  model,
  children,
}: {
  model: CreateMemeModeButtonModel
  children: ReactNode
}) {
  return (
    <Button size="segment" {...model.buttonProps} data-slot="mode-chip">
      {children}
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
  mode,
  showRemixModeButton,
  modeGroupProps,
  busy,
  busyElapsedLabel,
  err,
  errorNextStep,
  remixSource,
  remixSourceLoadingText,
  giphyCategories,
  giphyResults,
  giphyPick,
  giphyStatusText,
  giphyStatusHidden,
  remixPromptLabel,
  remixPromptPlaceholder,
  generatePromptPlaceholder,
  generatePromptHelpText,
  remixButtonLabel,
  generateButtonLabel,
  fetchUrlButtonLabel,
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
              <FieldLabel>Share link</FieldLabel>
              <Input {...shareUrlInputProps} />
            </Field>
            <Toolbar>
              <Link className={buttonVariants({ variant: 'primary' })} {...openMintedLinkProps}>
                Open the card
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
      <PageHead
        title="Mint a meme"
        subtitle="Make it strange. The internet will decide what happens next."
      />
      <div className="sr-only" role="status">{mintStatus}</div>

      {/* the source row sits above both columns, the full width of the content column */}
      <div data-slot="mint-modes" className={MODE_ROW} {...modeGroupProps}>
        {showRemixModeButton && (
          <ModeChip model={getModeButtonProps('remix')}>
            <span aria-hidden="true">
              <Icon name="dna" size={16} />
            </span>{' '}
            Remix
          </ModeChip>
        )}
        <ModeChip model={getModeButtonProps('generate')}>
          <span aria-hidden="true">
            <Icon name="palette" size={16} />
          </span>{' '}
          Generate image
        </ModeChip>
        <ModeChip model={getModeButtonProps('video')}>
          <span aria-hidden="true">
            <Icon name="clapperboard" size={16} />
          </span>{' '}
          Generate video
        </ModeChip>
        <ModeChip model={getModeButtonProps('upload')}>
          <span aria-hidden="true">
            <Icon name="upload" size={16} />
          </span>{' '}
          Upload
        </ModeChip>
        <ModeChip model={getModeButtonProps('giphy')}>
          <span aria-hidden="true">
            <Icon name="film" size={16} />
          </span>{' '}
          From Giphy
        </ModeChip>
        <ModeChip model={getModeButtonProps('url')}>
          <span aria-hidden="true">
            <Icon name="link" size={16} />
          </span>{' '}
          From URL
        </ModeChip>
      </div>

      <div className={LAYOUT}>
        <Card>
          <CardHeader>
            <CardTitle size="card-title">{FORM_HEADING[mode]}</CardTitle>
            <CardDescription>Turn a small thought into a card people can own.</CardDescription>
          </CardHeader>
          <div data-slot="form-grid" className={cn(FORM_GRID, 'mt-5')} {...formProps}>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input {...titleInputProps} placeholder={titlePlaceholder} />
              <FieldFooter className={CAPTION_OFFSET}>
                <FieldDescription id={helpIds.title}>{titleHelpText}</FieldDescription>
                <FieldCounter>{titleCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            <Field>
              <FieldLabel>Tags</FieldLabel>
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
                      Remixing <Link {...remixSource.linkProps}>"{remixSource.title}"</Link> by{' '}
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
                  <FieldLabel>{OUTPUT_LABEL}</FieldLabel>
                  <Select aria-label={OUTPUT_LABEL} {...remixOutputSelectProps} items={REMIX_OUTPUT_OPTIONS} />
                </Field>
                {showVideoRemixStyle && (
                  <Field>
                    <FieldLabel>{VIDEO_STYLE_LABEL}</FieldLabel>
                    <Select aria-label={VIDEO_STYLE_LABEL} {...videoModeSelectProps} items={VIDEO_REMIX_STYLE_OPTIONS} />
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
                          Edit applied — happy with this frame?
                        </EmptyTitle>
                        <EmptyDescription>
                          Keep it, then animate it or run another edit — check the card preview
                          before you spend render credits.
                        </EmptyDescription>
                      </EmptyHeader>
                      <Field className="w-full">
                        <FieldLabel>Motion (optional — how the animated clip should move)</FieldLabel>
                        <Textarea
                          {...motionPromptTextareaProps}
                          rows={3}
                          placeholder="he sprays himself in the face with the hose, same scene, short loop"
                        />
                      </Field>
                      <Toolbar>
                        <Button variant="primary" {...animateEditedButtonProps}>
                          <span aria-hidden="true">
                            <Icon name="clapperboard" size={16} />
                          </span>{' '}
                          Looks good — animate it
                        </Button>
                        <Button {...rerunEditButtonProps}>
                          <span aria-hidden="true">
                            <Icon name="rotate-cw" size={16} />
                          </span>{' '}
                          Re-run the edit
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
                    <span className={COST_NOTE}>Uses your Masky credits</span>
                  </Toolbar>
                )}
              </>
            ) : showGiphyPanel ? (
              <>
                <Field>
                  <FieldLabel>{CATEGORY_LABEL}</FieldLabel>
                  <Select
                    aria-label={CATEGORY_LABEL}
                    {...giphyCategorySelectProps}
                    items={[
                      GIPHY_BROWSE_OPTION,
                      ...giphyCategories.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </Field>
                <Field>
                  <FieldLabel>Search GIPHY</FieldLabel>
                  <Input {...giphyQueryInputProps} placeholder="keyboard cat" />
                </Field>
                <Toolbar>
                  <Button {...giphySearchButtonProps}>Search</Button>
                  <span className={GIPHY_MARK}>Powered by GIPHY</span>
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
                      Selected: <strong>{giphyPick.title}</strong>
                      {giphyPick.authorLabel} — mint it as-is (with GIPHY
                      attribution) or remix it below.
                    </Hint>
                    <Field>
                      <FieldLabel>
                        Optional prompt — remix the gif with Masky (uses your credits)
                      </FieldLabel>
                      <Textarea
                        {...giphyPromptTextareaProps}
                        rows={2}
                        placeholder="put everyone in medieval armor"
                      />
                    </Field>
                    {showGiphyRemixButton && (
                      <Toolbar className="mt-1">
                        <Button variant="primary" {...applyGiphyEditButtonProps}>
                          <Icon name="sparkles" size={16} /> Remix with Masky
                        </Button>
                        <span className={COST_NOTE}>Uses your Masky credits</span>
                      </Toolbar>
                    )}
                  </>
                )}
              </>
            ) : showUrlPanel ? (
              <>
                <Field>
                  <FieldLabel>Image or page URL</FieldLabel>
                  <Input {...urlInputProps} placeholder={urlPlaceholder} />
                  <FieldDescription className={CAPTION_OFFSET} id={helpIds.url}>
                    {urlHelpText}
                  </FieldDescription>
                </Field>
                <div>
                  <Button {...fetchUrlButtonProps}>{fetchUrlButtonLabel}</Button>
                </div>
                <Field>
                  <FieldLabel>
                    Optional prompt — run the image through Masky image-edit (uses your credits)
                  </FieldLabel>
                  <Textarea
                    {...urlPromptTextareaProps}
                    rows={2}
                    placeholder="same image but it's 3am and everything is on fire"
                  />
                </Field>
                {showUrlApplyEdit && (
                  <Toolbar className="mt-1">
                    <Button variant="primary" {...applyUrlEditButtonProps}>
                      <Icon name="sparkles" size={16} /> Apply AI edit
                    </Button>
                    <span className={COST_NOTE}>Uses your Masky credits</span>
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
                  <FieldLabel>Prompt</FieldLabel>
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
                  <span className={COST_NOTE}>Uses your Masky credits</span>
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
                    <EmptyDescription>The card stays here while the frame cooks.</EmptyDescription>
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

            <p className={FORM_NOTE}>
              Title is 20 characters max. You mint 100 shares to yourself.
            </p>
          </div>
        </Card>

        <div className={RAIL}>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle size="card-title">Live card preview</CardTitle>
              <CardDescription>This is what lands in the marketplace.</CardDescription>
            </CardHeader>
            <div className="mt-5 flex flex-col gap-3">
              {/* placeholder keeps the preview column's silhouette before a card exists */}
              {!showPreviewCard && !showPreviewSkeleton && (
                <div data-slot="preview-placeholder" className={PREVIEW_PLACEHOLDER}>
                  Your card lands here.
                </div>
              )}
              {showPreviewSkeleton && <SkeletonCard />}
              {showPreviewCard && (
                <>
                  <PreviewCard card={previewCard} />
                  {previewCard.originLabel && <Hint className="mt-0">{previewCard.originLabel}</Hint>}
                </>
              )}
              {showMintHint && <Hint className="mt-0">To mint: {mintHint}</Hint>}
            </div>
            {/* phone: shares line above a full-width Mint pill */}
            <div className="mt-4 flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch max-md:gap-2">
              <span className="text-sm font-semibold text-foreground max-md:font-medium max-md:text-muted-foreground">
                100 shares to you
              </span>
              <Button variant="primary" className="max-md:w-full" {...mintButtonProps}>
                <Icon name="sparkles" size={16} /> Mint
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
