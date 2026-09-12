import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyState } from '../atoms/EmptyState'
import {
  Field,
  FieldCounter,
  FieldFooter,
  FieldHint,
  FieldLabel,
  Hint,
} from '../atoms/Field'
import { Input } from '../atoms/Input'
/* the foil sheet and the chip, not the card atom: this screen paints a card frame out of its own
   markup, and the mint route is code-split — pulling `MemeCard.tsx` in would put its `react-router`
   and model imports on the critical path of a `lazy()` route that renders none of them.
   `atoms/foil.css` and `atoms/TierChip` are the dependency-free halves of that seam. */
import '../atoms/foil.css'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import { SkeletonCard } from '../atoms/Skeleton'
import { Spinner } from '../atoms/Spinner'
import { Textarea } from '../atoms/Textarea'
import { TierChip } from '../atoms/TierChip'
import type {
  CreateMemeCardModel,
  CreateMemeModeButtonModel,
  CreateMemeScreenModel,
} from '../lib/createMemeModel'
import type { CreateMemeMode } from '../stores/createMemeMachine'
import { cn } from '../lib/cn'

/* the mint form the user was standing on is gone at success: park focus on the outcome, not <body> */
const focusOutcome = (node: HTMLHeadingElement | null): void => node?.focus()

/** Form and preview columns; preview stacks below the form under 1000px. */
const LAYOUT =
  'grid grid-cols-[minmax(0,1fr)] items-start gap-5 3xl:grid-cols-[minmax(0,555fr)_minmax(0,522fr)] 3xl:gap-[31px]'
/** the preview column sticks to the top of the scroll once the two columns split */
const RAIL = 'flex flex-col gap-4 3xl:sticky 3xl:top-[calc(var(--topbar-h)+16px)]'
const FORM_GRID = 'flex flex-col gap-3.5'
/* option copy is words, so it lives here with the rest of them; the model only carries the value */
const REMIX_OUTPUT_OPTIONS: SelectOption[] = [
  { value: 'image', label: '🎨 New image (edit the art)' },
  { value: 'video', label: '🎬 New video' },
]
const VIDEO_REMIX_STYLE_OPTIONS: SelectOption[] = [
  { value: 'edit', label: '🎯 Precise edit (change something, then animate)' },
  { value: 'restyle', label: '🌀 Restyle the whole video (transforms the look)' },
]
/* the browse row reads as its own prompt, so the resting value is a real option, not a placeholder */
const GIPHY_BROWSE_OPTION: SelectOption = { value: '', label: 'Browse categories…' }
/* mounted in every state: out of flow until it has something to say, spaced once it does */
const LIVE_REGION = 'empty:sr-only [&:not(:empty)]:mb-4'
/**
 * A caption row sits 4px under its control on this form, where `Field`'s own rhythm is the 6px it
 * puts between a label and its control. `-mt-0.5` spends the difference, so the pair reads as one
 * unit; `[&>*]:mt-0` inside `FieldFooter` keeps its children from adding a second offset.
 */
const CAPTION_OFFSET = '-mt-0.5'

/** The page's own title face, restated where the outcome heading is written by hand. */
const OUTCOME_HEADING = cn(
  'm-0 font-display text-display font-medium tracking-display text-ink',
  'max-md:text-display-phone',
)

const CARD_SUB = 'm-0 mt-[5px] text-small font-normal text-ink-muted'

/**
 * The source row: 34px raised pills (44 on a phone, where they are the primary control row), radius
 * 17, 13px labels leading with their emoji. Selected is the pressed well the `Button` atom already
 * paints off `aria-pressed`, so this is geometry only — no second "selected" look.
 */
const CHIP = cn(
  'h-[34px] rounded-[17px] px-3 text-caption font-medium',
  'max-md:h-11 max-md:rounded-[22px] max-md:text-label pointer-coarse:h-11 pointer-coarse:rounded-[22px]',
)
const MODE_ROW = 'mb-5 flex flex-wrap items-center gap-2'

/** Cost caption beside a render action. */
const COST_NOTE = 'text-caption font-semibold text-ink-muted'
const FORM_NOTE = 'mt-1 text-micro font-medium text-ink-muted'

/** Mint state cards: left-aligned, tone-coloured titles override the form Panel's h3 step. */
const STATE_CARD = cn(
  'rounded-field p-4 text-left',
  '[&_h3]:m-0 [&_h3]:font-display [&_h3]:text-card-title-phone [&_h3]:font-medium [&_h3]:tracking-card-title',
  '[&_p]:m-0 [&_p]:mt-2 [&_p]:text-small [&_p]:font-medium [&_p]:text-ink-muted',
)
/* busy uses raised fill so it reads inside the surface-toned form panel */
const STATE_CARD_BUSY = cn(STATE_CARD, 'bg-surface-raised shadow-raised', '[&_h3]:text-ink-muted')
const STATE_CARD_APPROVAL = cn(STATE_CARD, '[&_h3]:text-success-text')
/** Progress groove: pressed track with the action colour. */
const TRACK = 'mt-3 block h-1.5 overflow-hidden rounded-[3px] bg-surface-pressed'
const TRACK_FILL = cn(
  'block h-full w-[35%] rounded-[3px] bg-action',
  'animate-pulse motion-reduce:animate-none',
)

const GIPHY_CELL = cn(
  'block h-auto aspect-square w-full overflow-hidden rounded-field bg-surface-pressed p-0',
  'shadow-pressed',
)
/* the picked cell keeps its ring on hover: the state is a ring, never a border colour */
const GIPHY_CELL_PICKED = 'inset-ring-2 inset-ring-action'
const GIPHY_MARK = 'text-micro font-bold tracking-[0.6px] whitespace-nowrap text-ink-muted uppercase'
const LOADING_STATE = 'flex items-center justify-center gap-2.5 px-5 py-15 text-small text-ink-muted'
/** Preflight strips the file-selector button bare; this gives it the app's own neutral pill. */
const FILE_INPUT = cn(
  'file:mr-2.5 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-raised',
  'file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-ink file:shadow-raised',
)

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
    <Button {...model.buttonProps} className={CHIP}>
      {children}
    </Button>
  )
}

/* The mint preview's box model, spelled out here because the meme has no id, no link and no
   `MemeCardModel` until it is minted: the card is `atoms/MemeCard`'s recipe (raised surface, 8px of
   padding, radius 25) and the frame carries the 3px tier border `atoms/foil.css` paints on
   `.foil-frame` off the variables `cardProps.className` sets. */
const PREVIEW_CARD = 'group relative isolate rounded-card bg-surface p-2 shadow-raised @container'
const PREVIEW_INNER = 'relative flex h-full flex-col'
const PREVIEW_FRAME = 'foil-frame foil-media relative rounded-field bg-surface-pressed'
/* same plate the marketplace card uses: a square, the whole meme contained */
const PREVIEW_ART = 'block aspect-square w-full bg-surface-pressed object-contain'
const PREVIEW_META = 'flex flex-col px-1.5 pt-3.5 pb-1.5'
/** Preview title one step above the grid card size. */
const PREVIEW_TITLE = cn(
  'overflow-hidden text-ellipsis whitespace-nowrap',
  'font-display text-title font-medium tracking-title text-ink',
  'max-md:text-card-title-phone',
)
const PREVIEW_TIER_NOTE = 'mt-1.5 text-caption font-bold text-ink-muted'
/** The plate the card will land on, at the card's own frame geometry. */
const PREVIEW_PLACEHOLDER = cn(
  'flex aspect-square items-center justify-center rounded-card bg-surface-pressed shadow-pressed',
  'text-small font-medium text-ink-muted',
)
const PREVIEW_SUB = cn(
  'mt-3 flex items-center justify-between gap-2 text-small font-semibold text-ink-muted tabular-nums',
  '@max-[220px]:flex-wrap @max-[220px]:gap-y-0.5',
)

/** The meme as it will ship, assembled while you type. */
function PreviewCard({ card }: { card: CreateMemeCardModel }) {
  return (
    <div
      {...card.cardProps}
      data-slot="meme-card"
      className={cn(PREVIEW_CARD, card.cardProps.className)}
    >
      <div data-slot="meme-card-inner" className={PREVIEW_INNER}>
        <span data-slot="foil-media" className={PREVIEW_FRAME}>
          {card.media.kind === 'video' ? (
            <video
              data-slot="meme-art"
              className={PREVIEW_ART}
              {...card.media.videoProps}
            />
          ) : (
            <img data-slot="meme-art" className={PREVIEW_ART} {...card.media.imageProps} />
          )}
          <TierChip tierKey="paper" label={card.tierName} className="absolute bottom-4 left-4 z-[2]" />
        </span>
        <div data-slot="meme-meta" className={PREVIEW_META}>
          <span data-slot="meme-title" className={PREVIEW_TITLE}>
            {card.title}
          </span>
          <span data-slot="tier-note" className={PREVIEW_TIER_NOTE}>
            {card.tierLabel}
          </span>
          <span data-slot="meme-sub" className={PREVIEW_SUB}>
            <span>{card.statsLabel}</span>
            <span>{card.valueLabel}</span>
          </span>
        </div>
      </div>
    </div>
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
  imageFileInputProps,
  videoFileInputProps,
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
          <h2 tabIndex={-1} ref={focusOutcome} className={OUTCOME_HEADING}>
            {successHeading}
          </h2>
        </div>
        <div className="sr-only" role="status">{mintStatus}</div>
        <div className={LAYOUT}>
          <div className={RAIL}>
            <PreviewCard card={successCard} />
          </div>
          <Panel className="flex flex-col gap-3.5">
            <p className={CARD_SUB}>{successBody}</p>
            <Field>
              <FieldLabel>Share link</FieldLabel>
              <Input {...shareUrlInputProps} />
            </Field>
            <FilterBar>
              <Link className={buttonClasses('primary')} {...openMintedLinkProps}>
                Open the card
              </Link>
              <Button {...copyShareLinkButtonProps}>{copyShareLinkLabel}</Button>
            </FilterBar>
          </Panel>
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
          <ModeChip model={getModeButtonProps('remix')}>🧬 Remix</ModeChip>
        )}
        <ModeChip model={getModeButtonProps('generate')}>🎨 Generate image</ModeChip>
        <ModeChip model={getModeButtonProps('video')}>🎬 Generate video</ModeChip>
        <ModeChip model={getModeButtonProps('upload')}>📤 Upload</ModeChip>
        <ModeChip model={getModeButtonProps('giphy')}>🎞️ From Giphy</ModeChip>
        <ModeChip model={getModeButtonProps('url')}>🔗 From URL</ModeChip>
      </div>

      <div className={LAYOUT}>
        <Panel>
          <PanelHeading size="card" className="mb-0">{FORM_HEADING[mode]}</PanelHeading>
          <p className={CARD_SUB}>Turn a small thought into a card people can own.</p>
          <div data-slot="form-grid" className={cn(FORM_GRID, 'mt-5')} {...formProps}>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input {...titleInputProps} placeholder={titlePlaceholder} />
              <FieldFooter className={CAPTION_OFFSET}>
                <FieldHint id={helpIds.title}>{titleHelpText}</FieldHint>
                <FieldCounter>{titleCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            <Field>
              <FieldLabel>Tags</FieldLabel>
              <Input {...tagsInputProps} placeholder={tagsPlaceholder} />
              <FieldFooter className={CAPTION_OFFSET}>
                <FieldHint id={helpIds.tags}>{tagsHelpText}</FieldHint>
                <FieldCounter>{tagsCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            {showRemixPanel ? (
              <>
                {remixSource ? (
                  <FilterBar>
                    <img
                      {...remixSource.imageProps}
                      className="size-21 rounded-field object-cover"
                    />
                    <Hint as="span">
                      Remixing <Link {...remixSource.linkProps}>"{remixSource.title}"</Link> by{' '}
                      {remixSource.creatorName}
                    </Hint>
                  </FilterBar>
                ) : (
                  <div className={LOADING_STATE} role="status">
                    <Spinner />
                    {remixSourceLoadingText}
                  </div>
                )}
                <Field>
                  <FieldLabel>Output</FieldLabel>
                  <Select {...remixOutputSelectProps} items={REMIX_OUTPUT_OPTIONS} />
                </Field>
                {showVideoRemixStyle && (
                  <Field>
                    <FieldLabel>Video remix style</FieldLabel>
                    <Select {...videoModeSelectProps} items={VIDEO_REMIX_STYLE_OPTIONS} />
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
                  /* wrapper keeps data-slot: EmptyState overwrites consumer slot after spread.
                     role="none" — panel live region already announces this turn */
                  <div data-slot="approval-card">
                    <EmptyState tone="ok" role="none" className={STATE_CARD_APPROVAL}>
                      <h3>✅ Edit applied — happy with this frame?</h3>
                      <p>
                        Keep it, then animate it or run another edit — check the card preview before
                        you spend render credits.
                      </p>
                      <Field className="mt-3.5">
                        <FieldLabel>Motion (optional — how the animated clip should move)</FieldLabel>
                        <Textarea
                          {...motionPromptTextareaProps}
                          rows={3}
                          placeholder="he sprays himself in the face with the hose, same scene, short loop"
                        />
                      </Field>
                      <FilterBar className="mt-3.5">
                        <Button variant="primary" {...animateEditedButtonProps}>
                          🎬 Looks good — animate it
                        </Button>
                        <Button {...rerunEditButtonProps}>↻ Re-run the edit</Button>
                      </FilterBar>
                    </EmptyState>
                  </div>
                )}
                {showRemixButton && (
                  <FilterBar className="mt-1">
                    <Button variant="primary" {...remixButtonProps}>
                      {remixButtonLabel}
                    </Button>
                    <span className={COST_NOTE}>Uses your Masky credits</span>
                  </FilterBar>
                )}
              </>
            ) : showGiphyPanel ? (
              <>
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select
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
                <FilterBar>
                  <Button {...giphySearchButtonProps}>Search</Button>
                  <span className={GIPHY_MARK}>Powered by GIPHY</span>
                </FilterBar>

                {showGiphyResults && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
                    {giphyResults.map((g) => {
                      const cell = getGiphyResultProps(g)
                      return (
                        <Button
                          key={g.id}
                          {...cell.buttonProps}
                          className={cn(GIPHY_CELL, cell.picked && GIPHY_CELL_PICKED)}
                        >
                          <img {...cell.imageProps} className="block h-full w-full object-cover" />
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* one live region for the panel: the chrome swaps, the element never remounts.
                    `sr-only` alone keeps the box, so the card frame is dropped explicitly */}
                <EmptyState
                  {...giphyStatusProps}
                  className={cn('py-8', giphyStatusHidden && 'sr-only bg-transparent p-0 shadow-none')}
                >
                  {giphyStatusText}
                </EmptyState>

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
                      <FilterBar className="mt-1">
                        <Button variant="primary" {...applyGiphyEditButtonProps}>
                          ✨ Remix with Masky
                        </Button>
                        <span className={COST_NOTE}>Uses your Masky credits</span>
                      </FilterBar>
                    )}
                  </>
                )}
              </>
            ) : showUrlPanel ? (
              <>
                <Field>
                  <FieldLabel>Image or page URL</FieldLabel>
                  <Input {...urlInputProps} placeholder={urlPlaceholder} />
                  <FieldHint className={CAPTION_OFFSET} id={helpIds.url}>
                    {urlHelpText}
                  </FieldHint>
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
                  <FilterBar className="mt-1">
                    <Button variant="primary" {...applyUrlEditButtonProps}>
                      ✨ Apply AI edit
                    </Button>
                    <span className={COST_NOTE}>Uses your Masky credits</span>
                  </FilterBar>
                )}
              </>
            ) : showUploadPanel ? (
              <>
                <Field>
                  <FieldLabel>{uploadImageLabel}</FieldLabel>
                  <Input {...imageFileInputProps} className={FILE_INPUT} />
                  <FieldHint className={CAPTION_OFFSET} id={helpIds.uploadImage}>
                    {uploadImageHelpText}
                  </FieldHint>
                </Field>
                <Field>
                  <FieldLabel>{uploadVideoLabel}</FieldLabel>
                  <Input {...videoFileInputProps} className={FILE_INPUT} />
                  <FieldHint className={CAPTION_OFFSET} id={helpIds.uploadVideo}>
                    {uploadVideoHelpText}
                  </FieldHint>
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
                  <FieldHint className={CAPTION_OFFSET} id={helpIds.prompt}>
                    {generatePromptHelpText}
                  </FieldHint>
                </Field>
                <FilterBar className="mt-1">
                  <Button variant="primary" {...generateButtonProps}>
                    {generateButtonLabel}
                  </Button>
                  <span className={COST_NOTE}>Uses your Masky credits</span>
                </FilterBar>
              </>
            ) : null}

            {/* both regions are mounted in every state and only their text swaps: a live region
                inserted together with its content is commonly missed */}
            <div data-slot="live-region" className={LIVE_REGION} {...busyNoticeProps}>
              {showBusy && (
                /* the outer div is the live region; a second status role here would announce
                   twice. The inner div keeps the named slot the atom's own `data-slot` would
                   otherwise overwrite (see the approval card). */
                <div data-slot="busy-card">
                  <EmptyState tone="neutral" role="none" className={STATE_CARD_BUSY}>
                    <h3>
                      {busy}
                      {busyElapsedLabel && <FieldCounter>{busyElapsedLabel}</FieldCounter>}
                    </h3>
                    <span className={TRACK} aria-hidden="true">
                      <i className={TRACK_FILL} />
                    </span>
                    <p>The card stays here while the frame cooks.</p>
                  </EmptyState>
                </div>
              )}
            </div>
            <div data-slot="live-region" className={LIVE_REGION} {...errorNoticeProps}>
              {showErr && (
                <Notice tone="error" role="none">
                  <span aria-hidden="true">⚠ </span>
                  {err}
                  {errorNextStep && <Hint as="span">{errorNextStep}</Hint>}
                </Notice>
              )}
            </div>

            <p className={FORM_NOTE}>
              Title is 20 characters max. You mint 100 shares to yourself.
            </p>
          </div>
        </Panel>

        <div className={RAIL}>
          <Panel className="flex flex-col">
            <PanelHeading size="card" className="mb-0">Live card preview</PanelHeading>
            <p className={CARD_SUB}>This is what lands in the marketplace.</p>
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
              <span className="text-small font-bold text-ink max-md:text-caption max-md:font-medium max-md:text-ink-muted">
                100 shares to you
              </span>
              <Button variant="primary" className="max-md:w-full" {...mintButtonProps}>
                ✨ Mint
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}
