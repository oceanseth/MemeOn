import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'

type Mode = 'generate' | 'video' | 'url' | 'upload' | 'remix'

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
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (!remixId) return
    apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
      .then((r) => setRemixSource(r.meme))
      .catch(() => setErr('source meme not found'))
  }, [remixId])

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
      } else {
        setBusy('Starting video remix (1–3 min, uses your Masky credits)…')
        setImageUrl(remixSource.imageUrl)
        const started = await post<{ generationId: string }>('/api/aigen/video', {
          prompt,
          ...(remixSource.mediaType === 'video' && remixSource.videoUrl
            ? { srcVideo: remixSource.videoUrl }
            : { image: remixSource.imageUrl }),
        })
        setBusy('Rendering video remix… hold the vibe.')
        await new Promise<void>((resolve, reject) => {
          pollRef.current = setInterval(async () => {
            try {
              const st = await fetchVideoStatus(started.generationId)
              if (st.status === 'video' && st.videoUrl) {
                setVideoUrl(st.videoUrl)
                if (pollRef.current) clearInterval(pollRef.current)
                resolve()
              } else if (st.status === 'error') {
                if (pollRef.current) clearInterval(pollRef.current)
                reject(new Error(st.errorMessage ?? 'video remix failed'))
              }
            } catch (e) {
              if (pollRef.current) clearInterval(pollRef.current)
              reject(e instanceof Error ? e : new Error('poll failed'))
            }
          }, 5000)
        })
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
      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          try {
            const st = await fetchVideoStatus(started.generationId)
            if (st.status === 'video' && st.videoUrl) {
              setVideoUrl(st.videoUrl)
              if (pollRef.current) clearInterval(pollRef.current)
              resolve()
            } else if (st.status === 'error') {
              if (pollRef.current) clearInterval(pollRef.current)
              reject(new Error(st.errorMessage ?? 'video generation failed'))
            }
          } catch (e) {
            if (pollRef.current) clearInterval(pollRef.current)
            reject(e instanceof Error ? e : new Error('poll failed'))
          }
        }, 5000)
      })
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
        mode === 'video' || ((mode === 'upload' || mode === 'remix') && !!videoUrl)
      const body = {
        title,
        imageUrl,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: isVideo ? videoUrl : null,
        remixOf: mode === 'remix' ? remixId : null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      const out = await post<{ meme: Meme }>('/api/memes', body)
      navigate(`/meme/${out.meme.id}`)
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
                  Remixing <Link to={`/meme/${remixSource.id}`}>"{remixSource.title}"</Link> by{' '}
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
                <option value="video">🎬 New video (animate it)</option>
              </select>
            </label>
            <label>
              Edit prompt (runs on your Masky credits)
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  remixOutput === 'video'
                    ? 'the capybara slowly turns to the camera as the office burns'
                    : 'same scene but everyone is a skeleton and it is raining'
                }
              />
            </label>
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
        ) : mode === 'url' ? (
          <label>
            Image URL
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/meme.png"
            />
          </label>
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
