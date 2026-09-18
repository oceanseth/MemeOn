import type { CreateMemeContext, CreateMemeDraft } from '../../stores/createMemeMachine'

export const PENDING_VIDEO_KEY = 'memeon_pending_video'

export function pendingVideoMatchesRemix(
  pendingRemixId: string | null | undefined,
  remixId: string | null,
): boolean {
  return (pendingRemixId ?? null) === remixId
}

export interface PendingVideoRecord {
  generationId: string
  startedAt: number
  imageUrl: string
  remixId: string | null
  draft: CreateMemeDraft
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
