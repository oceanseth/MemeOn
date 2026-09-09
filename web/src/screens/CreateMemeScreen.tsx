import { Link } from 'react-router-dom'
import type {
  CreateMemeCardModel,
  CreateMemeScreenModel,
} from '../hooks/useCreateMemeScreen'

/* the mint form the user was standing on is gone at success: park focus on the outcome, not <body> */
const focusOutcome = (node: HTMLHeadingElement | null): void => node?.focus()

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
      <main className="container" id="main" tabIndex={-1}>
        <div className="page-head">
          <h2 tabIndex={-1} ref={focusOutcome}>{successHeading}</h2>
        </div>
        <div className="sr-only" role="status">{mintStatus}</div>
        <div className="create-layout">
          <div className="create-rail stack">
            <PreviewCard card={successCard} />
          </div>
          <div className="stack">
            <p className="muted">{successBody}</p>
            <label className="field-label">
              Share link
              <input {...shareUrlInputProps} />
            </label>
            <div className="filter-bar">
              <button {...copyShareLinkButtonProps}>{copyShareLinkLabel}</button>
              <Link className="btn primary" {...openMintedLinkProps}>
                Open the card
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="page-head">
        <h2>Mint a meme</h2>
      </div>
      <div className="sr-only" role="status">{mintStatus}</div>
      <div className="create-layout">
        <div className="panel form-grid" {...formProps}>
          <div className="filter-bar" {...modeGroupProps}>
            {showRemixModeButton && (
              <button {...getModeButtonProps('remix')}>
                🧬 Remix
              </button>
            )}
            <button {...getModeButtonProps('generate')}>
              🎨 Generate image
            </button>
            <button {...getModeButtonProps('video')}>
              🎬 Generate video
            </button>
            <button {...getModeButtonProps('upload')}>
              📤 Upload
            </button>
            <button {...getModeButtonProps('giphy')}>
              🎞️ From Giphy
            </button>
            <button {...getModeButtonProps('url')}>
              🔗 From URL
            </button>
          </div>

          <div>
            <label>
              Title
              <input {...titleInputProps} placeholder={titlePlaceholder} />
            </label>
            <span className="field-counter">{titleCounterLabel}</span>
            <span className="field-help" id={helpIds.title}>
              {titleHelpText}
            </span>
          </div>

          <div>
            <label>
              Tags
              <input {...tagsInputProps} placeholder={tagsPlaceholder} />
            </label>
            <span className="field-counter">{tagsCounterLabel}</span>
            <span className="field-help" id={helpIds.tags}>
              {tagsHelpText}
            </span>
          </div>

          {showRemixPanel ? (
            <>
              {remixSource ? (
                <div className="filter-bar" style={{ alignItems: 'center' }}>
                  <img
                    {...remixSource.imageProps}
                    style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }}
                  />
                  <span className="field-help">
                    Remixing <Link {...remixSource.linkProps}>"{remixSource.title}"</Link> by{' '}
                    {remixSource.creatorName}
                  </span>
                </div>
              ) : (
                <div className="loading-state" role="status">
                  <span className="spin" aria-hidden="true" />
                  {remixSourceLoadingText}
                </div>
              )}
              <label>
                Output
                <select {...remixOutputSelectProps}>
                  <option value="image">🎨 New image (edit the art)</option>
                  <option value="video">🎬 New video</option>
                </select>
              </label>
              {showVideoRemixStyle && (
                <label>
                  Video remix style
                  <select {...videoModeSelectProps}>
                    <option value="edit">🎯 Precise edit (change something, then animate)</option>
                    <option value="restyle">🌀 Restyle the whole video (transforms the look)</option>
                  </select>
                </label>
              )}
              <label>
                {remixPromptLabel}
                <textarea
                  {...remixPromptTextareaProps}
                  rows={3}
                  placeholder={remixPromptPlaceholder}
                />
              </label>
              {showEditedFrameApproval && (
                <div className="panel" style={{ borderColor: 'var(--gold)' }}>
                  <strong>✅ Edit applied — happy with this frame?</strong>
                  <p className="field-help">
                    Check the card preview. Animate it, or tweak the prompt and re-run the edit
                    before spending render credits.
                  </p>
                  <label>
                    Motion (optional — how the animated clip should move)
                    <textarea
                      {...motionPromptTextareaProps}
                      rows={3}
                      placeholder="he sprays himself in the face with the hose, same scene, short loop"
                    />
                  </label>
                  <div className="filter-bar" style={{ marginTop: 10 }}>
                    <button className="primary" {...animateEditedButtonProps}>
                      🎬 Looks good — animate it
                    </button>
                    <button {...rerunEditButtonProps}>
                      ↻ Re-run the edit
                    </button>
                  </div>
                </div>
              )}
              {showRemixButton && (
                <div>
                  <button className="primary" {...remixButtonProps}>
                    {remixButtonLabel}
                  </button>
                </div>
              )}
            </>
          ) : showGiphyPanel ? (
            <>
              <label>
                Category
                <select {...giphyCategorySelectProps}>
                  <option value="">Browse categories…</option>
                  {giphyCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Search GIPHY
                <input {...giphyQueryInputProps} placeholder="keyboard cat" />
              </label>
              <div className="filter-bar">
                <button {...giphySearchButtonProps}>Search</button>
                <span className="giphy-mark">Powered by GIPHY</span>
              </div>

              {showGiphyResults && (
                <div className="giphy-grid">
                  {giphyResults.map((g) => {
                    const cell = getGiphyResultProps(g)
                    return (
                      <button key={g.id} {...cell.buttonProps}>
                        <img {...cell.imageProps} />
                      </button>
                    )
                  })}
                </div>
              )}

              <div {...giphyStatusProps}>{giphyStatusText}</div>

              {showGiphyPick && giphyPick && (
                <>
                  <p className="field-help">
                    Selected: <strong>{giphyPick.title}</strong>
                    {giphyPick.authorLabel} — mint it as-is (with GIPHY
                    attribution) or remix it below.
                  </p>
                  <label>
                    Optional prompt — remix the gif with Masky (uses your credits)
                    <textarea
                      {...giphyPromptTextareaProps}
                      rows={2}
                      placeholder="put everyone in medieval armor"
                    />
                  </label>
                  {showGiphyRemixButton && (
                    <div>
                      <button className="primary" {...applyGiphyEditButtonProps}>
                        ✨ Remix with Masky
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : showUrlPanel ? (
            <>
              <div>
                <label>
                  Image or page URL
                  <input {...urlInputProps} placeholder={urlPlaceholder} />
                </label>
                <span className="field-help" id={helpIds.url}>
                  {urlHelpText}
                </span>
              </div>
              <div>
                <button {...fetchUrlButtonProps}>{fetchUrlButtonLabel}</button>
              </div>
              <label>
                Optional prompt — run the image through Masky image-edit (uses your credits)
                <textarea
                  {...urlPromptTextareaProps}
                  rows={2}
                  placeholder="same image but it's 3am and everything is on fire"
                />
              </label>
              {showUrlApplyEdit && (
                <div>
                  <button className="primary" {...applyUrlEditButtonProps}>
                    ✨ Apply AI edit
                  </button>
                </div>
              )}
            </>
          ) : showUploadPanel ? (
            <>
              <div>
                <label>
                  {uploadImageLabel}
                  <input {...imageFileInputProps} />
                </label>
                <span className="field-help" id={helpIds.uploadImage}>
                  {uploadImageHelpText}
                </span>
              </div>
              <div>
                <label>
                  {uploadVideoLabel}
                  <input {...videoFileInputProps} />
                </label>
                <span className="field-help" id={helpIds.uploadVideo}>
                  {uploadVideoHelpText}
                </span>
              </div>
            </>
          ) : showGeneratePanel ? (
            <>
              <div>
                <label>
                  Prompt
                  <textarea
                    {...generatePromptTextareaProps}
                    rows={3}
                    placeholder={generatePromptPlaceholder}
                  />
                </label>
                <span className="field-help" id={helpIds.prompt}>
                  {generatePromptHelpText}
                </span>
              </div>
              <div>
                <button className="primary" {...generateButtonProps}>
                  {generateButtonLabel}
                </button>
              </div>
            </>
          ) : null}

          {/* both regions are mounted in every state and only their text swaps: a live region
              inserted together with its content is commonly missed */}
          <div className="live-region" {...busyNoticeProps}>
            {showBusy && (
              <p className="notice busy">
                <span
                  className="spin"
                  style={{ verticalAlign: 'middle', marginRight: 8 }}
                  aria-hidden="true"
                />
                {busy}
                {busyElapsedLabel && <span className="field-counter">{busyElapsedLabel}</span>}
              </p>
            )}
          </div>
          <div className="live-region" {...errorNoticeProps}>
            {showErr && (
              <p className="notice error">
                <span aria-hidden="true">⚠ </span>
                {err}
                {errorNextStep && <span className="field-help">{errorNextStep}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="create-rail stack">
          {showPreviewSkeleton && <div className="skeleton skeleton-card" aria-hidden="true" />}
          {showPreviewCard && (
            <>
              <PreviewCard card={previewCard} />
              {previewCard.originLabel && (
                <p className="field-help">{previewCard.originLabel}</p>
              )}
            </>
          )}
          {showMintHint && <p className="field-help">To mint: {mintHint}</p>}
          <div>
            <button className="primary" {...mintButtonProps}>
              🧠 Mint (100 shares to you)
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
