import { createMemeCopy } from '../../copy/createMeme'
import { apiFetch } from '../api'
import { mintDeskError } from '../createMemeMintError'
import type { GiphyResult } from '../types'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

let latestGiphySearch = 0

export function loadGiphyCategories(host: CreateMemeActionHost): void {
  if (host.getCtx().giphyCategories.length > 0) return
  apiFetch<{ categories: string[] }>('/api/giphy/categories')
    .then((r) => host.send({ type: 'SET_GIPHY_CATEGORIES', categories: r.categories }))
    .catch(() => {})
}

export async function onGiphySearch(host: CreateMemeActionHost, q: string): Promise<void> {
  if (!q.trim()) return
  const requestId = ++latestGiphySearch
  host.send({ type: 'SET_GIPHY_QUERY', query: q })
  host.beginBusy(copy.busy.searchingGiphy)
  try {
    const r = await apiFetch<{ results: GiphyResult[] }>(
      `/api/giphy/search?q=${encodeURIComponent(q)}`,
    )
    if (requestId !== latestGiphySearch) return
    host.send({ type: 'SET_GIPHY_RESULTS', results: r.results })
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    if (requestId !== latestGiphySearch) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(e, copy.errors.giphySearchFailed),
    })
  }
}
