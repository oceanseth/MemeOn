import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'

type Mode = 'generate' | 'video' | 'url' | 'upload'

async function uploadFile(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await post<{ uploadUrl: string; publicUrl: string }>(
    '/api/uploads',
    { contentType: file.type },
  )
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type },
    body: file,
  })
  if (!put.ok) throw new Error(`upload failed (${put.status})`)
  return publicUrl
}

export default function CreateMeme() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('generate')
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
      const isVideo = mode === 'video' || (mode === 'upload' && !!videoUrl)
      const body = {
        title,
        imageUrl,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: isVideo ? videoUrl : null,
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
            placeholder="e.g. Distracted Capybara"
            maxLength={120}
          />
        </label>

        <label>
          Tags (comma-separated)
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="animals, chaos" />
        </label>

        {mode === 'url' ? (
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
              Image (the card art{videoUrl ? ' / video thumbnail' : ''})
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
              Video (optional — makes it a video meme)
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
            🪙 Mint (100 shares to you)
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
