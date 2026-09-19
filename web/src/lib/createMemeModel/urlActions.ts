import { createMemeCopy } from '../../copy/createMeme'
import { post } from '../api'
import { mintDeskError } from '../createMemeMintError'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

export async function onResolvePageUrl(host: CreateMemeActionHost): Promise<void> {
  const url = host.getCtx().urlDraft.trim()
  if (!url) return
  if (!/^https?:\/\//.test(url)) {
    host.send({ type: 'FAIL', err: copy.errors.notALink })
    return
  }
  if (/\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) {
    host.send({ type: 'SET_RESOLVED', imageUrl: url, videoUrl: null, source: null })
    return
  }
  host.beginBusy(copy.busy.resolvingPage)
  try {
    const out = await post<{
      imageUrl: string
      videoUrl: string | null
      source: {
        provider: string
        id: string
        url: string
        author: string | null
      } | null
    }>('/api/resolve-image', { url })
    host.send({
      type: 'SET_RESOLVED',
      imageUrl: out.imageUrl,
      videoUrl: out.videoUrl,
      source: out.source,
    })
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    host.settleBusy({ type: 'FAIL', err: mintDeskError(e, copy.errors.resolveFailed) })
  }
}
