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
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { FilterBar, PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import { SkeletonCard } from '../atoms/Skeleton'
import { Spinner } from '../atoms/Spinner'
import { Textarea } from '../atoms/Textarea'
import type {
  CreateMemeCardModel,
  CreateMemeModeButtonModel,
  CreateMemeScreenModel,
} from '../hooks/useCreateMemeScreen'
import { cn } from '../lib/cn'

/* the mint form the user was standing on is gone at success: park focus on the outcome, not <body> */
const focusOutcome = (node: HTMLHeadingElement | null): void => node?.focus()

/* the form column beside the live preview rail; the rail only leaves the flow at 1000px */
const LAYOUT =
  'grid grid-cols-[minmax(0,1fr)] items-start gap-5 3xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]'
const RAIL =
  'flex max-w-[420px] flex-col gap-4 3xl:sticky 3xl:top-[calc(var(--topbar-h)+16px)]'
/* the panel's min-content must not size the grid track, so the measure lives on the panel */
const FORM_PANEL = 'max-w-[560px]'
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
/* preflight drops the UA heading weight the page title was rendered at */
const PAGE_TITLE = 'mt-7 mb-5 flex flex-wrap items-center justify-between gap-4'
const HEADING = 'm-0 text-[24px] font-bold'
/* the sort-chip scale on top of the button chrome. `leading-[normal]` because the chip labels lead
   with an emoji, and the taller emoji line box is what set the chip's height before the migration. */
const CHIP = 'rounded-pill px-[11px] py-[5px] text-xs leading-[normal]'
/* selected outranks focus by fill and weight, not border colour */
const CHIP_SELECTED = cn(
  'border-(--state-selected-border) bg-(--state-selected-bg) font-semibold text-text',
  'shadow-[inset_0_0_0_1px_var(--state-selected-border)]',
)
const GIPHY_CELL =
  'block aspect-square w-full overflow-hidden rounded-control border-border bg-bg-media p-0'
/* the picked cell keeps its gold on hover, so it wears the button chrome's own hover variant */
const GIPHY_CELL_PICKED = cn(
  'border-gold shadow-[0_0_12px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]',
  '[&:not(:disabled):hover]:border-gold',
)
const GIPHY_MARK =
  'text-[11px] font-extrabold tracking-[0.6px] whitespace-nowrap text-text-dim uppercase'
const LOADING_STATE = 'flex items-center justify-center gap-2.5 px-5 py-15 text-sm text-text-dim'
/* preflight strips the file-selector-button down to unstyled inline text (border/padding/radius: 0);
   this rebuilds the UA's own dark-scheme ButtonFace/ButtonText chrome the baseline screenshot shows —
   an achromatic grey button, not the app's navy control fill, since it stands in for OS chrome. */
const FILE_INPUT =
  'file:mr-1.5 file:cursor-pointer file:rounded-xs file:border-0 file:bg-neutral-500 ' +
  'file:px-2.5 file:py-0.5 file:font-medium file:text-white hover:file:bg-neutral-400'

/** One source chip. The engine names the state; the chrome for that state lives here. */
function ModeChip({
  model,
  children,
}: {
  model: CreateMemeModeButtonModel
  children: ReactNode
}) {
  return (
    <Button
      {...model.buttonProps}
      className={cn(CHIP, model.selected && CHIP_SELECTED)}
    >
      {children}
    </Button>
  )
}

/** The meme as it will ship. Same card vocabulary as the marketplace, assembled while you type. */
function PreviewCard({ card }: { card: CreateMemeCardModel }) {
  return (
    <div {...card.cardProps}>
      <div className="meme-card-inner">
        <span className="foil-media">
          {card.media.kind === 'video' ? (
            <video {...card.media.videoProps} />
          ) : (
            <img {...card.media.imageProps} />
          )}
        </span>
        <div className="meme-meta">
          <span className="meme-title">{card.title}</span>
          <span>
            <span className="tier-chip" style={{ color: card.tierColor }}>
              {card.tierLabel}
            </span>
          </span>
          <span className="meme-sub">
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
        <div data-slot="page-head" className={PAGE_TITLE}>
          <h2 tabIndex={-1} ref={focusOutcome} className={HEADING}>
            {successHeading}
          </h2>
        </div>
        <div className="sr-only" role="status">{mintStatus}</div>
        <div className={LAYOUT}>
          <div className={RAIL}>
            <PreviewCard card={successCard} />
          </div>
          <div className="flex flex-col gap-4">
            <p className="mt-4 mb-0 text-text-dim">{successBody}</p>
            <Field>
              <FieldLabel>Share link</FieldLabel>
              <Input {...shareUrlInputProps} />
            </Field>
            <FilterBar>
              <Button {...copyShareLinkButtonProps}>{copyShareLinkLabel}</Button>
              <Link className={buttonClasses('primary')} {...openMintedLinkProps}>
                Open the card
              </Link>
            </FilterBar>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead title="Mint a meme" className="[&>h2]:font-bold" />
      <div className="sr-only" role="status">{mintStatus}</div>
      <div className={LAYOUT}>
        <Panel className={FORM_PANEL}>
          <div data-slot="form-grid" className={FORM_GRID} {...formProps}>
            <FilterBar {...modeGroupProps}>
              {showRemixModeButton && (
                <ModeChip model={getModeButtonProps('remix')}>🧬 Remix</ModeChip>
              )}
              <ModeChip model={getModeButtonProps('generate')}>🎨 Generate image</ModeChip>
              <ModeChip model={getModeButtonProps('video')}>🎬 Generate video</ModeChip>
              <ModeChip model={getModeButtonProps('upload')}>📤 Upload</ModeChip>
              <ModeChip model={getModeButtonProps('giphy')}>🎞️ From Giphy</ModeChip>
              <ModeChip model={getModeButtonProps('url')}>🔗 From URL</ModeChip>
            </FilterBar>

            {/* the caption rows drop their own top margin: the field's 6px gap already spaces them,
                and the legacy pair sat 4px under the control, not 10px */}
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input {...titleInputProps} placeholder={titlePlaceholder} />
              <FieldFooter className="mt-0">
                <FieldHint id={helpIds.title}>{titleHelpText}</FieldHint>
                <FieldCounter>{titleCounterLabel}</FieldCounter>
              </FieldFooter>
            </Field>

            <Field>
              <FieldLabel>Tags</FieldLabel>
              <Input {...tagsInputProps} placeholder={tagsPlaceholder} />
              <FieldFooter className="mt-0">
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
                      className="size-21 rounded-control object-cover"
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
                  <Panel className="border-gold">
                    <strong>✅ Edit applied — happy with this frame?</strong>
                    <Hint className="mb-4">
                      Check the card preview. Animate it, or tweak the prompt and re-run the edit
                      before spending render credits.
                    </Hint>
                    <Field>
                      <FieldLabel>Motion (optional — how the animated clip should move)</FieldLabel>
                      <Textarea
                        {...motionPromptTextareaProps}
                        rows={3}
                        placeholder="he sprays himself in the face with the hose, same scene, short loop"
                      />
                    </Field>
                    <FilterBar className="mt-2.5">
                      <Button variant="primary" {...animateEditedButtonProps}>
                        🎬 Looks good — animate it
                      </Button>
                      <Button {...rerunEditButtonProps}>↻ Re-run the edit</Button>
                    </FilterBar>
                  </Panel>
                )}
                {showRemixButton && (
                  <div>
                    <Button variant="primary" {...remixButtonProps}>
                      {remixButtonLabel}
                    </Button>
                  </div>
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
                    `sr-only` alone keeps the box, so the dashed frame is dropped explicitly */}
                <EmptyState
                  {...giphyStatusProps}
                  className={cn(giphyStatusHidden && 'sr-only border-0 p-0')}
                >
                  {giphyStatusText}
                </EmptyState>

                {showGiphyPick && giphyPick && (
                  <>
                    <Hint className="mb-4">
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
                      <div>
                        <Button variant="primary" {...applyGiphyEditButtonProps}>
                          ✨ Remix with Masky
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : showUrlPanel ? (
              <>
                <Field>
                  <FieldLabel>Image or page URL</FieldLabel>
                  <Input {...urlInputProps} placeholder={urlPlaceholder} />
                  <FieldHint className="mt-0" id={helpIds.url}>
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
                  <div>
                    <Button variant="primary" {...applyUrlEditButtonProps}>
                      ✨ Apply AI edit
                    </Button>
                  </div>
                )}
              </>
            ) : showUploadPanel ? (
              <>
                <Field>
                  <FieldLabel>{uploadImageLabel}</FieldLabel>
                  <Input {...imageFileInputProps} className={FILE_INPUT} />
                  <FieldHint className="mt-0" id={helpIds.uploadImage}>
                    {uploadImageHelpText}
                  </FieldHint>
                </Field>
                <Field>
                  <FieldLabel>{uploadVideoLabel}</FieldLabel>
                  <Input {...videoFileInputProps} className={FILE_INPUT} />
                  <FieldHint className="mt-0" id={helpIds.uploadVideo}>
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
                  <FieldHint className="mt-0" id={helpIds.prompt}>
                    {generatePromptHelpText}
                  </FieldHint>
                </Field>
                <div>
                  <Button variant="primary" {...generateButtonProps}>
                    {generateButtonLabel}
                  </Button>
                </div>
              </>
            ) : null}

            {/* both regions are mounted in every state and only their text swaps: a live region
                inserted together with its content is commonly missed */}
            <div data-slot="live-region" className={LIVE_REGION} {...busyNoticeProps}>
              {showBusy && (
                /* the wrapper is the live region; a second status role here would announce twice.
                   inline-flex, so the notice still shrink-wraps its copy the way the block did */
                <Notice tone="busy" role="none" className="inline-flex items-center gap-2">
                  <Spinner />
                  {/* the counter is grouped with the busy copy, not a third flex item, so it lands
                      flush against the text the way the legacy floated `.field-counter` did — the
                      row's own gap-2 (spinner-to-text) stays untouched */}
                  <span>
                    {busy}
                    {busyElapsedLabel && <FieldCounter>{busyElapsedLabel}</FieldCounter>}
                  </span>
                </Notice>
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
          </div>
        </Panel>

        <div className={RAIL}>
          {showPreviewSkeleton && <SkeletonCard />}
          {showPreviewCard && (
            <>
              <PreviewCard card={previewCard} />
              {previewCard.originLabel && <Hint className="mt-0">{previewCard.originLabel}</Hint>}
            </>
          )}
          {/* a caption's own 4px offset only ever showed on the rail's first child; under the card
              the rail's own rhythm owns the gap */}
          {showMintHint && (
            <Hint className={cn((showPreviewCard || showPreviewSkeleton) && 'mt-0')}>
              To mint: {mintHint}
            </Hint>
          )}
          <div>
            <Button variant="primary" {...mintButtonProps}>
              🧠 Mint (100 shares to you)
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
