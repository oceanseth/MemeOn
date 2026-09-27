import { describe, expect, it } from 'vitest'
import { UnexpectedRequestLedger } from './request-accounting'

describe('UnexpectedRequestLedger', () => {
  it('does not fail an explicitly handled request set', () => {
    expect(() => new UnexpectedRequestLedger().assertEmpty()).not.toThrow()
  })

  it('reports every unexpected request from the current scenario', async () => {
    const ledger = new UnexpectedRequestLedger()
    const response = ledger.record('get', '/api/unexpected')
    expect(response.status).toBe(599)
    await expect(response.json()).resolves.toEqual({
      error: 'Unexpected connected-scenario request: GET /api/unexpected',
    })
    ledger.record('post', '/api/other', { id: 1 })
    expect(ledger.requests).toEqual([
      { method: 'GET', path: '/api/unexpected', body: undefined },
      { method: 'POST', path: '/api/other', body: { id: 1 } },
    ])
    expect(() => ledger.assertEmpty()).toThrow(
      'Unexpected connected-scenario request: GET /api/unexpected\n' +
        'Unexpected connected-scenario request: POST /api/other',
    )
  })
})
