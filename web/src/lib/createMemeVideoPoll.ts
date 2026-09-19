import { createMemeCopy } from '../copy/createMeme'
import { apiFetch } from './api'
import { clearPendingVideo, getPendingVideo } from './sessionBus'

const copy = createMemeCopy

export const POLL_TIMEOUT_MS = 8 * 60_000
export const POLL_INTERVAL_MS = 5000

export interface CreationLifetime {
  active: boolean
}

export interface VideoStatus {
  status: string
  videoUrl?: string
  errorMessage?: string
}

export class CreationLifetimeCancelledError extends Error {
  constructor() {
    super(copy.errors.lifetimeEnded)
    this.name = 'CreationLifetimeCancelledError'
  }
}

export function assertActive(owner: CreationLifetime): void {
  if (!owner.active) throw new CreationLifetimeCancelledError()
}

export function isLifetimeCancellation(error: unknown): boolean {
  return error instanceof CreationLifetimeCancelledError
}

export function fetchVideoStatus(id: string): Promise<VideoStatus> {
  return apiFetch(`/api/aigen/video/${id}`)
}

export function clearPendingVideoIfOwned(generationId: string, startedAt: number): void {
  const raw = getPendingVideo()
  if (!raw) return
  try {
    const pending = JSON.parse(raw) as { generationId?: unknown; startedAt?: unknown }
    if (pending.generationId === generationId && pending.startedAt === startedAt) {
      clearPendingVideo()
    }
  } catch {
    /* A malformed record is handled by the mount-time recovery path. */
  }
}

export interface VideoPollRun {
  owner: CreationLifetime
  interval: ReturnType<typeof setInterval> | null
  reject: (reason: Error) => void
  settled: boolean
}

export interface VideoPollDeps {
  fetchStatus?: (id: string) => Promise<VideoStatus>
  now?: () => number
  setIntervalFn?: typeof setInterval
  clearIntervalFn?: typeof clearInterval
}

export function cancelVideoPollRun(
  pollRunRef: { current: VideoPollRun | null },
  run: VideoPollRun,
  clearIntervalFn: typeof clearInterval = clearInterval,
): void {
  if (run.settled) return
  run.settled = true
  if (run.interval) clearIntervalFn(run.interval)
  if (pollRunRef.current === run) pollRunRef.current = null
  run.reject(new CreationLifetimeCancelledError())
}

/** Owns at most one in-flight video-status poll via `pollRunRef`; a new start cancels the previous run. */
export function pollVideoStatus(
  pollRunRef: { current: VideoPollRun | null },
  generationId: string,
  startedAt: number,
  owner: CreationLifetime,
  persistPending: (generationId: string, startedAt: number) => void,
  deps: VideoPollDeps = {},
): Promise<string> {
  const fetchStatus = deps.fetchStatus ?? fetchVideoStatus
  const now = deps.now ?? Date.now
  const setIntervalFn = deps.setIntervalFn ?? setInterval
  const clearIntervalFn = deps.clearIntervalFn ?? clearInterval
  const cancelPollRun = (run: VideoPollRun) => cancelVideoPollRun(pollRunRef, run, clearIntervalFn)

  return new Promise<string>((resolve, reject) => {
    if (!owner.active) {
      reject(new CreationLifetimeCancelledError())
      return
    }
    if (pollRunRef.current) cancelPollRun(pollRunRef.current)
    const run: VideoPollRun = { owner, interval: null, reject, settled: false }
    pollRunRef.current = run
    persistPending(generationId, startedAt)
    const finish = (fn: () => void) => {
      if (!owner.active || pollRunRef.current !== run) {
        cancelPollRun(run)
        return
      }
      run.settled = true
      if (run.interval) clearIntervalFn(run.interval)
      pollRunRef.current = null
      clearPendingVideoIfOwned(generationId, startedAt)
      fn()
    }
    run.interval = setIntervalFn(async () => {
      if (!owner.active || pollRunRef.current !== run) {
        cancelPollRun(run)
        return
      }
      if (now() - startedAt > POLL_TIMEOUT_MS) {
        return finish(() => reject(new Error(copy.errors.stillRendering(generationId))))
      }
      try {
        const st = await fetchStatus(generationId)
        if (!owner.active || pollRunRef.current !== run) {
          cancelPollRun(run)
          return
        }
        if (st.status === 'video' && st.videoUrl) {
          const url = st.videoUrl
          finish(() => resolve(url))
        } else if (st.status === 'error') {
          finish(() => reject(new Error(st.errorMessage ?? copy.errors.videoGenerationFailed)))
        }
      } catch (error) {
        if (!owner.active || pollRunRef.current !== run) {
          cancelPollRun(run)
          return
        }
        if (isLifetimeCancellation(error)) return
        /* transient poll failure — keep going until timeout */
      }
    }, POLL_INTERVAL_MS)
  })
}

/** Cancels the in-flight poll owned by `owner`, if any. */
export function cancelVideoPollForOwner(
  pollRunRef: { current: VideoPollRun | null },
  owner: CreationLifetime,
  clearIntervalFn: typeof clearInterval = clearInterval,
): void {
  const run = pollRunRef.current
  if (run?.owner === owner) cancelVideoPollRun(pollRunRef, run, clearIntervalFn)
}
