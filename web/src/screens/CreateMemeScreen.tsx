import { Link } from 'react-router-dom'
import type { CreateMemeScreenModel } from '../hooks/useCreateMemeScreen'

/** Mint form as a function of its model. Every engine state is one set of args. */
export function CreateMemeScreen({
  showRemixModeButton,
  busy,
  err,
  remixSource,
  giphyCategories,
  giphyResults,
  giphyPick,
  remixPromptLabel,
  remixPromptPlaceholder,
  generatePromptPlaceholder,
  remixButtonLabel,
  generateButtonLabel,
  mintHint,
  showRemixPanel,
  showGiphyPanel,
  showUrlPanel,
  showUploadPanel,
  showGeneratePanel,
  showVideoRemixStyle,
  showEditedFrameApproval,
  showGiphyResults,
  showGiphyPick,
  showGiphyRemixButton,
  showUrlApplyEdit,
  showBusy,
  showErr,
  showImagePreview,
  showVideoPreview,
  showMintHint,
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
  urlPromptTextareaProps,
  applyUrlEditButtonProps,
  imageFileInputProps,
  videoFileInputProps,
  generatePromptTextareaProps,
  generateButtonProps,
  mintButtonProps,
  busyNoticeProps,
  errorNoticeProps,
  imagePreviewProps,
  videoPreviewProps,
}: CreateMemeScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2>Mint a meme</h2>
      </div>
      <div className="panel form-grid" {...formProps}>
        <div className="filter-bar">
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

        <label>
          Title
          <input
            {...titleInputProps}
            placeholder="max 20 chars — fits the card banner"
          />
        </label>

        <label>
          Tags (comma-separated)
          <input {...tagsInputProps} placeholder="animals, chaos" />
        </label>

        {showRemixPanel ? (
          <>
            {remixSource ? (
              <div className="filter-bar" style={{ alignItems: 'center' }}>
                <img
                  {...remixSource.imageProps}
                  style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }}
                />
                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  Remixing <Link {...remixSource.linkProps}>"{remixSource.title}"</Link> by{' '}
                  {remixSource.creatorName}
                </span>
              </div>
            ) : (
              <span className="spin" />
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
                <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '6px 0 10px' }}>
                  Check the preview below. Animate it, or tweak the prompt and re-run the edit
                  before spending render credits.
                </p>
                <label>
                  Motion (optional — how the animated clip should move)
                  <textarea
                    {...motionPromptTextareaProps}
                    rows={2}
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
            <div>
              <button className="primary" {...remixButtonProps}>
                {remixButtonLabel}
              </button>
            </div>
          </>
        ) : showGiphyPanel ? (
          <>
            <div className="filter-bar">
              <select {...giphyCategorySelectProps}>
                <option value="">Browse categories…</option>
                {giphyCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                {...giphyQueryInputProps}
                placeholder="Search Giphy…"
                style={{ minWidth: 200 }}
              />
              <button {...giphySearchButtonProps}>Search</button>
              <span className="giphy-mark">Powered by GIPHY</span>
            </div>

            {showGiphyResults && (
              <div className="giphy-grid">
                {giphyResults.map((g) => (
                  <img key={g.id} {...getGiphyResultProps(g)} />
                ))}
              </div>
            )}

            {showGiphyPick && giphyPick && (
              <>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
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
            <label>
              Image or page URL (giphy/imgur/reddit pages work — we grab the main image)
              <input
                {...urlInputProps}
                placeholder="https://giphy.com/gifs/… or https://…/meme.png"
              />
            </label>
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
            <label>
              Image (optional for videos — we grab the first frame; max 8MB)
              <input {...imageFileInputProps} />
            </label>
            <label>
              Video (optional — makes it a video meme; max 50MB)
              <input {...videoFileInputProps} />
            </label>
          </>
        ) : showGeneratePanel ? (
          <>
            <label>
              Prompt (runs on your Masky credits)
              <textarea
                {...generatePromptTextareaProps}
                rows={3}
                placeholder={generatePromptPlaceholder}
              />
            </label>
            <div>
              <button className="primary" {...generateButtonProps}>
                {generateButtonLabel}
              </button>
            </div>
          </>
        ) : null}

        {showBusy && (
          <p className="notice ok" {...busyNoticeProps}>
            <span className="spin" style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden="true" />
            {busy}
          </p>
        )}
        {showErr && <p className="notice error" {...errorNoticeProps}>{err}</p>}

        {showImagePreview && (
          <img
            {...imagePreviewProps}
            style={{ maxWidth: 320, borderRadius: 12, border: '1px solid var(--border)' }}
          />
        )}
        {showVideoPreview && (
          <video {...videoPreviewProps} style={{ maxWidth: 320, borderRadius: 12 }} />
        )}

        <div>
          {showMintHint && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '0 0 8px' }}>
              To mint: {mintHint}
            </p>
          )}
          <button className="primary" {...mintButtonProps}>
            🧠 Mint (100 shares to you)
          </button>
        </div>
      </div>
    </main>
  )
}
