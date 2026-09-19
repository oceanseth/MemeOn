import { createMemeCopy } from '../copy/createMeme'
import { ApiError } from './api'

const copy = createMemeCopy

const CREDITS_TEXT = /credit|402|quota|balance/i

function isAuthoredMintCopy(message: string): boolean {
  for (const value of Object.values(copy.errors)) {
    if (typeof value === 'string' && value === message) return true
  }
  const rejectedStatus = message.match(/\((\d+)\)/)?.[1]
  if (rejectedStatus !== undefined && message === copy.errors.uploadRejected(Number(rejectedStatus))) {
    return true
  }
  const token = '__generationId__'
  const sample = copy.errors.stillRendering(token)
  const marker = sample.indexOf(token)
  if (marker === -1) return false
  const prefix = sample.slice(0, marker)
  const suffix = sample.slice(marker + token.length)
  if (!prefix || !suffix || !message.startsWith(prefix) || !message.endsWith(suffix)) return false
  const generationId = message.slice(prefix.length, message.length - suffix.length)
  return message === copy.errors.stillRendering(generationId)
}

/** Map a mint-desk catch onto createMemeCopy.errors. Never dump POST /api/… onto the alert. */
export function mintDeskError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : ''
  if (error instanceof ApiError && error.status === 402) {
    return copy.errors.creditsExhausted
  }
  if (error instanceof ApiError && error.status === 413) {
    return copy.errors.uploadRejected(413)
  }
  if (message && isAuthoredMintCopy(message)) return message
  if (CREDITS_TEXT.test(message)) return copy.errors.creditsExhausted
  return fallback
}
