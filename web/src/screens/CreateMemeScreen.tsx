import { Link } from 'react-router-dom'
import type { CreateMemeScreenModel } from '../hooks/useCreateMemeScreen'

/** Mint form as a function of its model. Every engine state is one set of args. */
export function CreateMemeScreen({
  mode,
  showRemixModeButton,
  title,
  tags,
  prompt,
  imageUrl,
  videoUrl,
  busy,
  err,
  remixSource,
  remixOutput,
  videoMode,
  motionPrompt,
  giphyCategories,
  giphyQuery,
  giphyResults,
  giphyPick,
  remixPromptLabel,
  remixPromptPlaceholder,
  generatePromptPlaceholder,
  remixButtonLabel,
  generateButtonLabel,
  mintHint,
  canMint,
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
  onSelectMode,
  onTitleChange,
  onTagsChange,
  onPromptChange,
  onRemixOutputChange,
  onVideoModeChange,
  onMotionPromptChange,
  onGiphyQueryChange,
  onGiphySearch,
  onPickGiphy,
  onUrlChange,
  onResolvePageUrl,
  onApplyGiphyEdit,
  onApplyUrlEdit,
  onImageFile,
  onVideoFile,
  onRemix,
  onAnimateEdited,
  onGenerate,
  onMint,
}: CreateMemeScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2>Mint a meme</h2>
      </div>
      <div className="panel form-grid">
        <div className="filter-bar">
          {showRemixModeButton && (
            <button className={mode === 'remix' ? 'primary' : ''} onClick={() => onSelectMode('remix')}>
              🧬 Remix
            </button>
          )}
          <button className={mode === 'generate' ? 'primary' : ''} onClick={() => onSelectMode('generate')}>
            🎨 Generate image
          </button>
          <button className={mode === 'video' ? 'primary' : ''} onClick={() => onSelectMode('video')}>
            🎬 Generate video
          </button>
          <button className={mode === 'upload' ? 'primary' : ''} onClick={() => onSelectMode('upload')}>
            📤 Upload
          </button>
          <button className={mode === 'giphy' ? 'primary' : ''} onClick={() => onSelectMode('giphy')}>
            🎞️ From Giphy
          </button>
          <button className={mode === 'url' ? 'primary' : ''} onClick={() => onSelectMode('url')}>
            🔗 From URL
          </button>
        </div>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="max 20 chars — fits the card banner"
            maxLength={20}
          />
        </label>

        <label>
          Tags (comma-separated)
          <input value={tags} onChange={(e) => onTagsChange(e.target.value)} placeholder="animals, chaos" />
        </label>

        {showRemixPanel ? (
          <>
            {remixSource ? (
              <div className="filter-bar" style={{ alignItems: 'center' }}>
                <img
                  src={remixSource.imageUrl}
                  alt={remixSource.title}
                  style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }}
                />
                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  Remixing <Link to={`/m/${remixSource.id}`}>"{remixSource.title}"</Link> by{' '}
                  {remixSource.creatorName}
                </span>
              </div>
            ) : (
              <span className="spin" />
            )}
            <label>
              Output
              <select
                value={remixOutput}
                onChange={(e) => onRemixOutputChange(e.target.value as 'image' | 'video')}
              >
                <option value="image">🎨 New image (edit the art)</option>
                <option value="video">🎬 New video</option>
              </select>
            </label>
            {showVideoRemixStyle && (
              <label>
                Video remix style
                <select
                  value={videoMode}
                  onChange={(e) => onVideoModeChange(e.target.value as 'edit' | 'restyle')}
                >
                  <option value="edit">🎯 Precise edit (change something, then animate)</option>
                  <option value="restyle">🌀 Restyle the whole video (transforms the look)</option>
                </select>
              </label>
            )}
            <label>
              {remixPromptLabel}
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
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
                    rows={2}
                    value={motionPrompt}
                    onChange={(e) => onMotionPromptChange(e.target.value)}
                    placeholder="he sprays himself in the face with the hose, same scene, short loop"
                  />
                </label>
                <div className="filter-bar" style={{ marginTop: 10 }}>
                  <button className="primary" disabled={!!busy} onClick={onAnimateEdited}>
                    🎬 Looks good — animate it
                  </button>
                  <button disabled={!!busy || !prompt.trim()} onClick={onRemix}>
                    ↻ Re-run the edit
                  </button>
                </div>
              </div>
            )}
            <div>
              <button
                className="primary"
                disabled={!prompt.trim() || !remixSource || !!busy}
                onClick={onRemix}
              >
                {remixButtonLabel}
              </button>
            </div>
          </>
        ) : showGiphyPanel ? (
          <>
            <div className="filter-bar">
              <select
                value=""
                onChange={(e) => e.target.value && void onGiphySearch(e.target.value)}
              >
                <option value="">Browse categories…</option>
                {giphyCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="search"
                placeholder="Search Giphy…"
                value={giphyQuery}
                onChange={(e) => onGiphyQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void onGiphySearch(giphyQuery)}
                style={{ minWidth: 200 }}
              />
              <button onClick={() => void onGiphySearch(giphyQuery)} disabled={!giphyQuery.trim() || !!busy}>
                Search
              </button>
              <span className="giphy-mark">Powered by GIPHY</span>
            </div>

            {showGiphyResults && (
              <div className="giphy-grid">
                {giphyResults.map((g) => (
                  <img
                    key={g.id}
                    src={g.gifUrl}
                    alt={g.title}
                    title={g.title}
                    className={giphyPick?.id === g.id ? 'giphy-cell picked' : 'giphy-cell'}
                    onClick={() => onPickGiphy(g)}
                  />
                ))}
              </div>
            )}

            {showGiphyPick && giphyPick && (
              <>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
                  Selected: <strong>{giphyPick.title}</strong>
                  {giphyPick.author ? ` (@${giphyPick.author})` : ''} — mint it as-is (with GIPHY
                  attribution) or remix it below.
                </p>
                <label>
                  Optional prompt — remix the gif with Masky (uses your credits)
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="put everyone in medieval armor"
                  />
                </label>
                {showGiphyRemixButton && (
                  <div>
                    <button className="primary" disabled={!!busy} onClick={onApplyGiphyEdit}>
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
                value={imageUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                onBlur={onResolvePageUrl}
                onKeyDown={(e) => e.key === 'Enter' && void onResolvePageUrl()}
                placeholder="https://giphy.com/gifs/… or https://…/meme.png"
              />
            </label>
            <label>
              Optional prompt — run the image through Masky image-edit (uses your credits)
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="same image but it's 3am and everything is on fire"
              />
            </label>
            {showUrlApplyEdit && (
              <div>
                <button className="primary" disabled={!!busy} onClick={onApplyUrlEdit}>
                  ✨ Apply AI edit
                </button>
              </div>
            )}
          </>
        ) : showUploadPanel ? (
          <>
            <label>
              Image (optional for videos — we grab the first frame; max 8MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImageFile(f)
                }}
              />
            </label>
            <label>
              Video (optional — makes it a video meme; max 50MB)
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onVideoFile(f)
                }}
              />
            </label>
          </>
        ) : showGeneratePanel ? (
          <>
            <label>
              Prompt (runs on your Masky credits)
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={generatePromptPlaceholder}
              />
            </label>
            <div>
              <button
                className="primary"
                disabled={!prompt.trim() || !!busy}
                onClick={onGenerate}
              >
                {generateButtonLabel}
              </button>
            </div>
          </>
        ) : null}

        {showBusy && (
          <p className="notice ok">
            <span className="spin" style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {busy}
          </p>
        )}
        {showErr && <p className="notice error">{err}</p>}

        {showImagePreview && (
          <img
            src={imageUrl}
            alt="preview"
            style={{ maxWidth: 320, borderRadius: 12, border: '1px solid var(--border)' }}
          />
        )}
        {showVideoPreview && (
          <video src={videoUrl} controls style={{ maxWidth: 320, borderRadius: 12 }} />
        )}

        <div>
          {showMintHint && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '0 0 8px' }}>
              To mint: {mintHint}
            </p>
          )}
          <button className="primary" disabled={!canMint} onClick={onMint}>
            🧠 Mint (100 shares to you)
          </button>
        </div>
      </div>
    </main>
  )
}
