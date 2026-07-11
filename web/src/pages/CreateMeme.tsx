import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'

type Mode = 'generate' | 'video' | 'url' | 'upload' | 'remix' | 'giphy'

interface GiphyResult {
  id: string
  title: string
  stillUrl: string
  gifUrl: string
  mp4Url: string | null
  author: string | null
  url: string
}

async function uploadFile(file: File | Blob, contentType?: string): Promise<string> {
  const type = contentType ?? (file as File).type
  const { uploadUrl, publicUrl } = await post<{ uploadUrl: string; publicUrl: string }>(
    '/api/uploads',
    { contentType: type, size: file.size },
  )
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': type },
    body: file,
  })
  if (!put.ok) throw new Error(`upload failed (${put.status})`)
  return publicUrl
}

/** Grab the first frame of a video file as a PNG blob (browser-side, no server). */
function extractPoster(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url
    const fail = (why: string) => {
      URL.revokeObjectURL(url)
      reject(new Error(why))
    }
    video.onerror = () => fail('could not read video')
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0.1)
    }
    video.onseeked = () => {
      const size = 720
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return fail('canvas unavailable')
      // cover-crop into a square
      const s = Math.min(video.videoWidth, video.videoHeight)
      ctx.drawImage(
        video,
        (video.videoWidth - s) / 2,
        (video.videoHeight - s) / 2,
        s,
        s,
        0,
        0,
        size,
        size,
      )
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : fail('poster encode failed')), 'image/png')
    }
  })
}

export default function CreateMeme() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  const [mode, setMode] = useState<Mode>(remixId ? 'remix' : 'generate')
  const [remixSource, setRemixSource] = useState<Meme | null>(null)
  const [remixOutput, setRemixOutput] = useState<'image' | 'video'>('image')
  // video remixes: 'edit' = precise change (edit still, then animate — reliable);
  // 'restyle' = raw video-to-video (transforms the whole look, ignores fine edits)
  const [videoMode, setVideoMode] = useState<'edit' | 'restyle'>('edit')
  const [motionPrompt, setMotionPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // giphy mode
  const [giphyCategories, setGiphyCategories] = useState<string[]>([])
  const [giphyQuery, setGiphyQuery] = useState('')
  const [giphyResults, setGiphyResults] = useState<GiphyResult[]>([])
  const [giphyPick, setGiphyPick] = useState<GiphyResult | null>(null)
  // set after a Masky edit replaces the raw source image
  const [edited, setEdited] = useState(false)
  // attribution captured when a pasted page URL resolves (e.g. a giphy page)
  const [resolvedSource, setResolvedSource] = useState<{
    provider: string
    id: string
    url: string
    author: string | null
  } | null>(null)

  useEffect(() => {
    if (mode !== 'giphy' || giphyCategories.length > 0) return
    apiFetch<{ categories: string[] }>('/api/giphy/categories')
      .then((r) => setGiphyCategories(r.categories))
      .catch(() => {})
  }, [mode, giphyCategories.length])

  const giphySearch = async (q: string) => {
    if (!q.trim()) return
    setGiphyQuery(q)
    setBusy('Searching Giphy…')
    setErr(null)
    try {
      const r = await apiFetch<{ results: GiphyResult[] }>(
        `/api/giphy/search?q=${encodeURIComponent(q)}`,
      )
      setGiphyResults(r.results)
      if (r.results.length === 0) setErr(`Giphy came up empty for "${q}"`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'giphy search failed')
    } finally {
      setBusy(null)
    }
  }

  const pickGiphy = (g: GiphyResult) => {
    setGiphyPick(g)
    setImageUrl(g.gifUrl)
    setEdited(false)
    if (!title) setTitle(g.title.slice(0, 20))
  }

  /** If the pasted URL is an html page (giphy/imgur/…), swap in its main image. */
  const resolvePageUrl = async () => {
    const url = imageUrl.trim()
    // direct image links don't need resolving
    if (!url || !/^https?:\/\//.test(url) || /\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) return
    setBusy('Finding the main image on that page…')
    setErr(null)
    try {
      const out = await post<{
        imageUrl: string
        videoUrl: string | null
        source: { provider: string; id: string; url: string; author: string | null } | null
      }>('/api/resolve-image', { url })
      setImageUrl(out.imageUrl)
      if (out.videoUrl) setVideoUrl(out.videoUrl)
      setResolvedSource(out.source)
      setEdited(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'could not resolve that page')
    } finally {
      setBusy(null)
    }
  }

  /** Run the current prompt through Masky image-edit against the given source image. */
  const applyEdit = async (sourceUrl: string) => {
    setBusy('Remixing with Masky (uses your credits)…')
    setErr(null)
    try {
      const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
        prompt,
        imageUrls: [sourceUrl],
      })
      setImageUrl(out.imageUrl)
      setEdited(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'edit failed')
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (!remixId) return
    apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
      .then((r) => setRemixSource(r.meme))
      .catch(() => setErr('source meme not found'))
  }, [remixId])

  const PENDING_KEY = 'memeon_pending_video'
  const POLL_TIMEOUT_MS = 8 * 60_000

  /**
   * Poll a masky video job to completion with elapsed display, an 8-min
   * timeout, and sessionStorage bookkeeping so a refresh can resume it.
   */
  const pollVideo = (generationId: string, startedAt: number): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ generationId, startedAt, imageUrl, remixId }),
      )
      const finish = (fn: () => void) => {
        if (pollRef.current) clearInterval(pollRef.current)
        sessionStorage.removeItem(PENDING_KEY)
        fn()
      }
      pollRef.current = setInterval(async () => {
        const elapsed = Math.round((Date.now() - startedAt) / 1000)
        setBusy(`Rendering video… ${Math.floor(elapsed / 60)}m${String(elapsed % 60).padStart(2, '0')}s — hold the vibe.`)
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          return finish(() =>
            reject(
              new Error(
                `render is taking longer than 8 minutes — it may still finish on Masky (job ${generationId}); come back to this page to resume waiting`,
              ),
            ),
          )
        }
        try {
          const st = await fetchVideoStatus(generationId)
          if (st.status === 'video' && st.videoUrl) {
            const url = st.videoUrl
            finish(() => resolve(url))
          } else if (st.status === 'error') {
            finish(() => reject(new Error(st.errorMessage ?? 'video generation failed')))
          }
        } catch {
          /* transient poll failure — keep going until timeout */
        }
      }, 5000)
    })

  // resume a render that was in flight when the page was left/refreshed
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as {
        generationId: string
        startedAt: number
        imageUrl?: string
      }
      if (Date.now() - pending.startedAt > POLL_TIMEOUT_MS) {
        sessionStorage.removeItem(PENDING_KEY)
        return
      }
      if (pending.imageUrl) setImageUrl(pending.imageUrl)
      setBusy('Resuming a video render already in progress…')
      pollVideo(pending.generationId, pending.startedAt)
        .then((url) => setVideoUrl(url))
        .catch((e) => setErr(e instanceof Error ? e.message : 'render failed'))
        .finally(() => setBusy(null))
    } catch {
      sessionStorage.removeItem(PENDING_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remix = async () => {
    if (!remixSource) return
    setErr(null)
    try {
      if (remixOutput === 'image') {
        setBusy('Remixing the art (uses your Masky credits)…')
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt,
          imageUrls: [remixSource.imageUrl],
        })
        setImageUrl(out.imageUrl)
        setVideoUrl('')
      } else if (videoMode === 'restyle' && remixSource.mediaType === 'video' && remixSource.videoUrl) {
        // whole-video restyle: masky's ensemble transforms the look globally
        setBusy('Restyling the whole video (uses your Masky credits)…')
        setImageUrl(remixSource.imageUrl)
        const started = await post<{ generationId: string }>('/api/aigen/video', {
          prompt,
          srcVideo: remixSource.videoUrl,
        })
        setBusy('Rendering video remix… hold the vibe.')
        setVideoUrl(await pollVideo(started.generationId, Date.now()))
      } else {
        // precise edit: change the still first (reliable), then animate it
        setBusy('Step 1/2 — applying your edit to the frame (uses your Masky credits)…')
        const edited = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: `${prompt}, keep everything else identical`,
          imageUrls: [remixSource.imageUrl],
        })
        setImageUrl(edited.imageUrl)
        setBusy('Step 2/2 — animating the edited frame…')
        const started = await post<{ generationId: string }>('/api/aigen/video', {
          prompt:
            motionPrompt.trim() ||
            'subtle natural motion true to the scene, same style, short loop',
          image: edited.imageUrl,
        })
        setVideoUrl(await pollVideo(started.generationId, Date.now()))
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'remix failed')
    } finally {
      setBusy(null)
    }
  }

  const generateImage = async () => {
    setBusy('Rendering your masterpiece (uses your Masky credits)…')
    setErr(null)
    try {
      const out = await post<{ imageUrl: string }>('/api/aigen/image', {
        prompt,
        aspectRatio: '1:1',
      })
      setImageUrl(out.imageUrl)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'generation failed')
    } finally {
      setBusy(null)
    }
  }

  const generateVideo = async () => {
    setBusy('Starting video render (1–3 min, uses your Masky credits)…')
    setErr(null)
    try {
      // companion thumbnail for the card + og frame
      const thumb = await post<{ imageUrl: string }>('/api/aigen/image', {
        prompt: `${prompt} — single dramatic still frame, meme thumbnail`,
        aspectRatio: '1:1',
      })
      setImageUrl(thumb.imageUrl)
      const started = await post<{ generationId: string }>('/api/aigen/video', { prompt })
      setBusy('Rendering video… this takes a minute or three. Hold the vibe.')
      setVideoUrl(await pollVideo(started.generationId, Date.now()))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'video generation failed')
    } finally {
      setBusy(null)
    }
  }

  const mint = async () => {
    setBusy('Minting…')
    setErr(null)
    try {
      const isVideo =
        mode === 'video' ||
        ((mode === 'upload' || mode === 'remix' || mode === 'url') && !!videoUrl)
      const body = {
        title,
        imageUrl,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: isVideo ? videoUrl : null,
        remixOf: mode === 'remix' ? remixId : null,
        // attribution only when the raw giphy art is used unedited
        source:
          mode === 'giphy' && giphyPick && !edited
            ? { provider: 'giphy', id: giphyPick.id, url: giphyPick.url, author: giphyPick.author }
            : mode === 'url' && resolvedSource && !edited
              ? resolvedSource
              : null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      const out = await post<{ meme: Meme }>('/api/memes', body)
      navigate(`/m/${out.meme.id}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'mint failed')
      setBusy(null)
    }
  }

  const canMint =
    !!title.trim() && !!imageUrl && (mode !== 'video' || !!videoUrl) && !busy

  return (
    <main className="container">
      <div className="page-head">
        <h2>Mint a meme</h2>
      </div>
      <div className="panel form-grid">
        <div className="filter-bar">
          {remixId && (
            <button className={mode === 'remix' ? 'primary' : ''} onClick={() => setMode('remix')}>
              🧬 Remix
            </button>
          )}
          <button className={mode === 'generate' ? 'primary' : ''} onClick={() => setMode('generate')}>
            🎨 Generate image
          </button>
          <button className={mode === 'video' ? 'primary' : ''} onClick={() => setMode('video')}>
            🎬 Generate video
          </button>
          <button className={mode === 'upload' ? 'primary' : ''} onClick={() => setMode('upload')}>
            📤 Upload
          </button>
          <button className={mode === 'giphy' ? 'primary' : ''} onClick={() => setMode('giphy')}>
            🎞️ From Giphy
          </button>
          <button className={mode === 'url' ? 'primary' : ''} onClick={() => setMode('url')}>
            🔗 From URL
          </button>
        </div>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="max 20 chars — fits the card banner"
            maxLength={20}
          />
        </label>

        <label>
          Tags (comma-separated)
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="animals, chaos" />
        </label>

        {mode === 'remix' ? (
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
                onChange={(e) => setRemixOutput(e.target.value as 'image' | 'video')}
              >
                <option value="image">🎨 New image (edit the art)</option>
                <option value="video">🎬 New video</option>
              </select>
            </label>
            {remixOutput === 'video' && remixSource?.mediaType === 'video' && (
              <label>
                Video remix style
                <select
                  value={videoMode}
                  onChange={(e) => setVideoMode(e.target.value as 'edit' | 'restyle')}
                >
                  <option value="edit">🎯 Precise edit (change something, then animate)</option>
                  <option value="restyle">🌀 Restyle the whole video (transforms the look)</option>
                </select>
              </label>
            )}
            <label>
              {remixOutput === 'video' && videoMode === 'edit'
                ? 'What to change (runs on your Masky credits)'
                : 'Edit prompt (runs on your Masky credits)'}
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  remixOutput === 'video'
                    ? videoMode === 'edit'
                      ? 'add a claude icon to the tshirt he is wearing'
                      : 'make the whole scene look like a vaporwave painting'
                    : 'same scene but everyone is a skeleton and it is raining'
                }
              />
            </label>
            {remixOutput === 'video' && videoMode === 'edit' && (
              <label>
                Motion (optional — how the animated clip should move)
                <textarea
                  rows={2}
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  placeholder="he sprays himself in the face with the hose, same scene, short loop"
                />
              </label>
            )}
            <div>
              <button
                className="primary"
                disabled={!prompt.trim() || !remixSource || !!busy}
                onClick={remix}
              >
                {remixOutput === 'video' ? 'Remix into video' : 'Remix image'}
              </button>
            </div>
          </>
        ) : mode === 'giphy' ? (
          <>
            <div className="filter-bar">
              <select
                value=""
                onChange={(e) => e.target.value && void giphySearch(e.target.value)}
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
                onChange={(e) => setGiphyQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void giphySearch(giphyQuery)}
                style={{ minWidth: 200 }}
              />
              <button onClick={() => void giphySearch(giphyQuery)} disabled={!giphyQuery.trim() || !!busy}>
                Search
              </button>
              <span className="giphy-mark">Powered by GIPHY</span>
            </div>

            {giphyResults.length > 0 && (
              <div className="giphy-grid">
                {giphyResults.map((g) => (
                  <img
                    key={g.id}
                    src={g.gifUrl}
                    alt={g.title}
                    title={g.title}
                    className={giphyPick?.id === g.id ? 'giphy-cell picked' : 'giphy-cell'}
                    onClick={() => pickGiphy(g)}
                  />
                ))}
              </div>
            )}

            {giphyPick && (
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
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="put everyone in medieval armor"
                  />
                </label>
                {prompt.trim() && (
                  <div>
                    <button className="primary" disabled={!!busy} onClick={() => void applyEdit(giphyPick.stillUrl)}>
                      ✨ Remix with Masky
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : mode === 'url' ? (
          <>
            <label>
              Image or page URL (giphy/imgur/reddit pages work — we grab the main image)
              <input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setEdited(false)
                }}
                onBlur={() => void resolvePageUrl()}
                onKeyDown={(e) => e.key === 'Enter' && void resolvePageUrl()}
                placeholder="https://giphy.com/gifs/… or https://…/meme.png"
              />
            </label>
            <label>
              Optional prompt — run the image through Masky image-edit (uses your credits)
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="same image but it's 3am and everything is on fire"
              />
            </label>
            {prompt.trim() && imageUrl && !edited && (
              <div>
                <button className="primary" disabled={!!busy} onClick={() => void applyEdit(imageUrl)}>
                  ✨ Apply AI edit
                </button>
              </div>
            )}
          </>
        ) : mode === 'upload' ? (
          <>
            <label>
              Image (optional for videos — we grab the first frame; max 8MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setBusy('Uploading image…')
                  setErr(null)
                  try {
                    setImageUrl(await uploadFile(f))
                  } catch (er) {
                    setErr(er instanceof Error ? er.message : 'upload failed')
                  } finally {
                    setBusy(null)
                  }
                }}
              />
            </label>
            <label>
              Video (optional — makes it a video meme; max 50MB)
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setBusy('Uploading video…')
                  setErr(null)
                  try {
                    setVideoUrl(await uploadFile(f))
                    if (!imageUrl) {
                      // no art provided: auto-poster from the first frame
                      setBusy('Grabbing the first frame for the card…')
                      const poster = await extractPoster(f)
                      setImageUrl(await uploadFile(poster, 'image/png'))
                    }
                  } catch (er) {
                    setErr(er instanceof Error ? er.message : 'upload failed')
                  } finally {
                    setBusy(null)
                  }
                }}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Prompt (runs on your Masky credits)
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="a capybara in a business suit ignoring a burning office, cinematic"
              />
            </label>
            <div>
              <button
                className="primary"
                disabled={!prompt.trim() || !!busy}
                onClick={mode === 'video' ? generateVideo : generateImage}
              >
                {mode === 'video' ? 'Generate video' : 'Generate image'}
              </button>
            </div>
          </>
        )}

        {busy && (
          <p className="notice ok">
            <span className="spin" style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {busy}
          </p>
        )}
        {err && <p className="notice error">{err}</p>}

        {imageUrl && (
          <img
            src={imageUrl}
            alt="preview"
            style={{ maxWidth: 320, borderRadius: 12, border: '1px solid var(--border)' }}
          />
        )}
        {videoUrl && (
          <video src={videoUrl} controls style={{ maxWidth: 320, borderRadius: 12 }} />
        )}

        <div>
          <button className="primary" disabled={!canMint} onClick={mint}>
            🧠 Mint (100 shares to you)
          </button>
        </div>
      </div>
    </main>
  )
}

function fetchVideoStatus(id: string): Promise<{
  status: string
  videoUrl?: string
  errorMessage?: string
}> {
  return apiFetch(`/api/aigen/video/${id}`)
}
