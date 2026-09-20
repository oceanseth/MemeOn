import { describe, expect, it } from 'vitest'
import { createMemeCopy } from '../copy/createMeme'
import { ApiError } from './api'
import { mintDeskError } from './createMemeMintError'

const copy = createMemeCopy
const fallback = copy.errors.generationFailed

describe('mintDeskError', () => {
  it('maps 402 and credits-text onto copy.errors.creditsExhausted', () => {
    expect(mintDeskError(new ApiError(402, 'out of juice'), fallback)).toBe(
      copy.errors.creditsExhausted,
    )
    expect(mintDeskError(new ApiError(500, 'credits exhausted'), fallback)).toBe(
      copy.errors.creditsExhausted,
    )
    expect(mintDeskError(new Error('quota exceeded'), fallback)).toBe(copy.errors.creditsExhausted)
    expect(mintDeskError(new Error('402'), fallback)).toBe(copy.errors.creditsExhausted)
  })

  it('maps 413 onto copy.errors.uploadRejected(413)', () => {
    expect(mintDeskError(new ApiError(413, 'payload too large'), fallback)).toBe(
      copy.errors.uploadRejected(413),
    )
  })

  it('uses the per-catch fallback for other ApiError, including POST /api templates', () => {
    expect(mintDeskError(new ApiError(500, 'POST /api/aigen/image failed (500)'), fallback)).toBe(
      fallback,
    )
    expect(mintDeskError(new ApiError(403, 'forbidden'), copy.errors.mintFailed)).toBe(
      copy.errors.mintFailed,
    )
  })

  it('passes authored copy values through and falls back otherwise', () => {
    expect(
      mintDeskError(new Error(copy.errors.uploadRejected(403)), copy.errors.uploadFailed),
    ).toBe(copy.errors.uploadRejected(403))
    expect(
      mintDeskError(new Error(copy.errors.stillRendering('gen-9')), copy.errors.renderFailed),
    ).toBe(copy.errors.stillRendering('gen-9'))
    expect(mintDeskError(new Error(copy.errors.mintFailed), copy.errors.uploadFailed)).toBe(
      copy.errors.mintFailed,
    )
    expect(mintDeskError(new Error('Masky blew up'), fallback)).toBe(fallback)
    expect(mintDeskError('not-an-error', fallback)).toBe(fallback)
  })

  it('keeps stillRendering when the job id contains 402, before the credit regex', () => {
    expect(
      mintDeskError(new Error(copy.errors.stillRendering('abc402def')), copy.errors.renderFailed),
    ).toBe(copy.errors.stillRendering('abc402def'))
    expect(
      mintDeskError(new Error(copy.errors.uploadRejected(402)), copy.errors.uploadFailed),
    ).toBe(copy.errors.uploadRejected(402))
    expect(
      mintDeskError(new ApiError(402, copy.errors.stillRendering('abc402def')), fallback),
    ).toBe(copy.errors.creditsExhausted)
  })
})
