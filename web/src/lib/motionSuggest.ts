/**
 * A one-line description of how a clip moves, written by the browser's own on-device model
 * (Chrome's Prompt API). Nothing leaves the machine and nothing is billed, which is the whole
 * reason it exists: a server-side vision call per remix would cost more than the remix earns.
 *
 * It is a bonus, never a dependency. Every way it can be missing (another browser, a phone, a
 * machine without the model, a clip the canvas cannot read, a slow or confused model) resolves
 * to `null`, and the motion field stays as empty as it is everywhere else.
 */

/** How many stills the model sees. It gets no video, so motion is what differs between them. */
export const MOTION_FRAME_COUNT = 4

/** Long side of each still. Motion survives a small frame; a large one only slows the model. */
const FRAME_MAX_SIDE = 512

const LOAD_TIMEOUT_MS = 10_000
const SUGGEST_TIMEOUT_MS = 45_000

/** A motion prompt is one sentence; anything longer is the model rambling. */
export const MOTION_SUGGESTION_MAX = 200

/* prompt text for the on-device model, never shown: not copy */
const instruction = (title: string) =>
  `These ${MOTION_FRAME_COUNT} images are frames taken in order from one short video clip. ` +
  'In one sentence of at most 25 words, describe the motion in the clip: who or what moves and ' +
  'how. Describe only what changes between the frames. Ignore any caption text. Answer with ' +
  'the sentence alone.' +
  /* the title names the subject the stills alone leave as "a small animal" */
  (title ? ` For context only, the clip is titled "${title}".` : '')

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface PromptSession {
  prompt(
    input: Array<{ role: 'user'; content: Array<Record<string, unknown>> }>,
    options?: { signal?: AbortSignal },
  ): Promise<string>
  destroy(): void
}

interface PromptApi {
  availability(options: Record<string, unknown>): Promise<Availability>
  create(options: Record<string, unknown>): Promise<PromptSession>
}

const SESSION_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
}

function promptApi(): PromptApi | null {
  const api = (globalThis as { LanguageModel?: PromptApi }).LanguageModel
  return api && typeof api.availability === 'function' ? api : null
}

/**
 * True only when the model is already on this machine. `downloadable` is deliberately a no:
 * starting a multi-gigabyte download to save someone a sentence of typing is not ours to decide.
 */
export async function canSuggestMotion(): Promise<boolean> {
  const api = promptApi()
  if (!api) return false
  try {
    return (await api.availability(SESSION_OPTIONS)) === 'available'
  } catch {
    return false
  }
}

/** Evenly spaced moments inside the clip, clear of both ends (a loop's ends look alike). */
export function frameTimes(duration: number, count: number = MOTION_FRAME_COUNT): number[] {
  if (!Number.isFinite(duration) || duration <= 0) return []
  return Array.from({ length: count }, (_, i) => (duration * (i + 0.5)) / count)
}

/** What the model said, cut down to something that can sit in the motion field; '' → null. */
export function tidyMotionSuggestion(raw: string): string | null {
  let text = raw.replace(/\s+/g, ' ').trim()
  text = text.replace(/^["'“‘]+|["'”’]+$/g, '').trim()
  if (!text) return null
  if (text.length > MOTION_SUGGESTION_MAX) {
    const cut = text.slice(0, MOTION_SUGGESTION_MAX)
    const stop = cut.lastIndexOf('. ')
    text = stop > 0 ? cut.slice(0, stop + 1) : cut.trimEnd()
  }
  return text
}

function seek(video: HTMLVideoElement, time: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (outcome: () => void) => {
      video.onseeked = null
      video.onerror = null
      signal.removeEventListener('abort', onAbort)
      outcome()
    }
    const onAbort = () => done(() => reject(new Error('aborted')))
    signal.addEventListener('abort', onAbort)
    video.onseeked = () => done(resolve)
    video.onerror = () => done(() => reject(new Error('could not read video')))
    video.currentTime = time
  })
}

function loadVideo(src: string, signal: AbortSignal): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    /* without CORS the canvas is tainted and the model is refused the pixels */
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    const timer = setTimeout(
      () => done(() => reject(new Error('video timed out'))),
      LOAD_TIMEOUT_MS,
    )
    const done = (outcome: () => void) => {
      clearTimeout(timer)
      video.onloadeddata = null
      video.onerror = null
      signal.removeEventListener('abort', onAbort)
      outcome()
    }
    const onAbort = () => done(() => reject(new Error('aborted')))
    signal.addEventListener('abort', onAbort)
    video.onloadeddata = () => done(() => resolve(video))
    video.onerror = () => done(() => reject(new Error('could not read video')))
    video.src = src
  })
}

async function grabFrames(src: string, signal: AbortSignal): Promise<HTMLCanvasElement[]> {
  const video = await loadVideo(src, signal)
  try {
    const { videoWidth, videoHeight } = video
    if (!videoWidth || !videoHeight) throw new Error('could not read video')
    const scale = Math.min(1, FRAME_MAX_SIDE / Math.max(videoWidth, videoHeight))
    const width = Math.max(1, Math.round(videoWidth * scale))
    const height = Math.max(1, Math.round(videoHeight * scale))
    const frames: HTMLCanvasElement[] = []
    for (const time of frameTimes(video.duration)) {
      await seek(video, time, signal)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      ctx.drawImage(video, 0, 0, width, height)
      /* a tainted canvas throws here, not later inside the model call */
      ctx.getImageData(0, 0, 1, 1)
      frames.push(canvas)
    }
    return frames
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * Describe the motion of the clip at `videoUrl`, or `null` when this browser cannot.
 * Never rejects.
 */
export async function suggestMotion(videoUrl: string, title = ''): Promise<string | null> {
  const api = promptApi()
  if (!api || !(await canSuggestMotion())) return null
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), SUGGEST_TIMEOUT_MS)
  let session: PromptSession | null = null
  try {
    const frames = await grabFrames(videoUrl, abort.signal)
    if (frames.length < 2) return null
    session = await api.create({ ...SESSION_OPTIONS, signal: abort.signal })
    const answer = await session.prompt(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              value: instruction(
                title
                  .replace(/["\s]+/g, ' ')
                  .trim()
                  .slice(0, 80),
              ),
            },
            ...frames.map((value) => ({ type: 'image', value })),
          ],
        },
      ],
      { signal: abort.signal },
    )
    return typeof answer === 'string' ? tidyMotionSuggestion(answer) : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    try {
      session?.destroy()
    } catch {
      /* already destroyed by the abort signal */
    }
  }
}
