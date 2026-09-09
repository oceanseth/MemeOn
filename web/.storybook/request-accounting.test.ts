import { describe, expect, it } from 'vitest'
import { UnexpectedRequestLedger } from './request-accounting'

describe('UnexpectedRequestLedger', () => {
  it('does not fail an explicitly handled request set', () => {
    expect(() => new UnexpectedRequestLedger().assertEmpty()).not.toThrow()
  })

  it('reports every unexpected request from the current story', async () => {
    const ledger = new UnexpectedRequestLedger()
    const response = ledger.record('get', '/api/unexpected')
    expect(response.status).toBe(599)
    await expect(response.json()).resolves.toEqual({
      error: 'Unexpected connected-story request: GET /api/unexpected',
    })
    expect(() => ledger.assertEmpty()).toThrow(
      'Unexpected connected-story request: GET /api/unexpected',
    )
  })
})
