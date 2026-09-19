import type { CreationLifetime } from '../createMemeVideoPoll'
import type { CreateMemeContext, CreateMemeEvent } from '../../stores/createMemeMachine'

/**
 * Imperative host the create-meme hook passes into one-concern action modules.
 * Helpers here are plain functions, not React hooks.
 */
export interface CreateMemeActionHost {
  getCtx: () => CreateMemeContext
  send: (event: CreateMemeEvent) => void
  beginBusy: (busy: string, since?: number) => void
  settleBusy: (event: CreateMemeEvent) => void
  pollVideo: (generationId: string, startedAt: number, owner: CreationLifetime) => Promise<string>
  getOwner: () => CreationLifetime | null
}
