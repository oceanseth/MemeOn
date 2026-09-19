import { createMemeCopy } from '../../copy/createMeme'
import { post } from '../api'
import { mintDeskError } from '../createMemeMintError'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

export async function applyEdit(host: CreateMemeActionHost, sourceUrl: string): Promise<void> {
  host.beginBusy(copy.busy.editing)
  try {
    const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
      prompt: host.getCtx().prompt,
      imageUrls: [sourceUrl],
    })
    host.send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl, edited: true })
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    host.settleBusy({ type: 'FAIL', err: mintDeskError(e, copy.errors.editFailed) })
  }
}

export function applyGiphyEdit(host: CreateMemeActionHost): void | Promise<void> {
  const pick = host.getCtx().giphyPick
  if (pick) return applyEdit(host, pick.stillUrl)
}

export function applyUrlEdit(host: CreateMemeActionHost): void | Promise<void> {
  const url = host.getCtx().imageUrl
  if (url) return applyEdit(host, url)
}
