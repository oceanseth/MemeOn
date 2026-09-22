import type { CreateMemeContext, CreateMemeDraft } from '../../stores/createMemeMachine'
import { POLL_TIMEOUT_MS } from '../createMemeVideoPoll'
import { clearPendingVideo, getPendingVideo, setPendingVideo } from '../sessionBus'

export const DRAFT_PERSIST_MS = 400

export function pendingVideoMatchesRemix(
  pendingRemixId: string | null | undefined,
  remixId: string | null,
): boolean {
  return (pendingRemixId ?? null) === remixId
}

export interface PendingVideoRecord {
  generationId: string
  startedAt: number
  imageUrl?: string
  remixId: string | null
  draft?: CreateMemeDraft
}

/** The typed half of the resume record: a finished render is useless without the draft around it. */
export function draftOf(ctx: CreateMemeContext): CreateMemeDraft {
  return {
    mode: ctx.mode,
    title: ctx.title,
    tags: ctx.tags,
    prompt: ctx.prompt,
    motionPrompt: ctx.motionPrompt,
    remixOutput: ctx.remixOutput,
    videoUrl: ctx.videoUrl,
  }
}

export function pendingVideoRecord(
  ctx: CreateMemeContext,
  generationId: string,
  startedAt: number,
): PendingVideoRecord {
  return {
    generationId,
    startedAt,
    imageUrl: ctx.imageUrl,
    remixId: ctx.remixId,
    draft: draftOf(ctx),
  }
}

export function elapsedLabel(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** null/empty → null; JSON throw or invalid shape → malformed. draft and imageUrl are optional. */
export function parsePendingVideo(raw: string | null): PendingVideoRecord | 'malformed' | null {
  if (raw == null || raw === '') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed)) return 'malformed'
    const { generationId, startedAt } = parsed
    if (typeof generationId !== 'string' || generationId === '') return 'malformed'
    if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return 'malformed'
    const record: PendingVideoRecord = {
      generationId,
      startedAt,
      remixId: typeof parsed.remixId === 'string' ? parsed.remixId : null,
    }
    if (typeof parsed.imageUrl === 'string') record.imageUrl = parsed.imageUrl
    if (isObject(parsed.draft)) record.draft = parsed.draft as unknown as CreateMemeDraft
    return record
  } catch {
    return 'malformed'
  }
}

export function readPendingVideo(): PendingVideoRecord | 'malformed' | null {
  return parsePendingVideo(getPendingVideo())
}

export function writePendingVideo(record: PendingVideoRecord): void {
  setPendingVideo(JSON.stringify(record))
}

export function persistPendingVideo(
  ctx: CreateMemeContext,
  generationId: string,
  startedAt: number,
): void {
  writePendingVideo(pendingVideoRecord(ctx, generationId, startedAt))
}

export function createDraftPersister(getCtx: () => CreateMemeContext): {
  schedule(): void
  dispose(): void
} {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        const pending = readPendingVideo()
        if (pending == null || pending === 'malformed') return
        writePendingVideo({ ...pending, draft: draftOf(getCtx()) })
      }, DRAFT_PERSIST_MS)
    },
    dispose() {
      if (timer) clearTimeout(timer)
      timer = null
    },
  }
}

export type PendingVideoRestore =
  | { kind: 'none' }
  | { kind: 'cleared' }
  | { kind: 'mismatch' }
  | { kind: 'resume'; record: PendingVideoRecord }

export function takePendingVideoRestore(remixId: string | null, now: number): PendingVideoRestore {
  const pending = readPendingVideo()
  if (pending == null) return { kind: 'none' }
  if (pending === 'malformed' || now - pending.startedAt > POLL_TIMEOUT_MS) {
    clearPendingVideo()
    return { kind: 'cleared' }
  }
  if (!pendingVideoMatchesRemix(pending.remixId, remixId)) return { kind: 'mismatch' }
  return { kind: 'resume', record: pending }
}

export function clearPendingVideoIfOwned(generationId: string, startedAt: number): void {
  const pending = readPendingVideo()
  if (pending == null || pending === 'malformed') return
  if (pending.generationId === generationId && pending.startedAt === startedAt) {
    clearPendingVideo()
  }
}
