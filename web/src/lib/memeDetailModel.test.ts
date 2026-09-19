import { describe, expect, it } from 'vitest'
import { buildTierLadderModel } from './memeDetailModel'

describe('buildTierLadderModel', () => {
  it('places paper at 50% of the first rung at 5 views', () => {
    expect(buildTierLadderModel('paper', 5).value).toBe(50)
  })

  it('fills the meter at the top of the ladder', () => {
    expect(buildTierLadderModel('shiny', 41_000).value).toBe(100)
  })
})
