import { createMemeCopy } from '../../copy/createMeme'
import { post } from '../api'
import { mintDeskError } from '../createMemeMintError'
import type { Meme } from '../types'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

export async function onMint(host: CreateMemeActionHost): Promise<void> {
  const live = host.getCtx()
  host.beginBusy(copy.busy.minting)
  try {
    const isVideo =
      live.mode === 'video' ||
      ((live.mode === 'upload' || live.mode === 'remix' || live.mode === 'url') && !!live.videoUrl)
    const body = {
      title: live.title,
      imageUrl: live.imageUrl,
      mediaType: isVideo ? 'video' : 'image',
      videoUrl: isVideo ? live.videoUrl : null,
      remixOf: live.mode === 'remix' ? live.remixId : null,
      source: live.artworkSource,
      tags: live.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    const out = await post<{ meme: Meme }>('/api/memes', body)
    host.settleBusy({
      type: 'MINTED',
      id: out.meme.id,
      shareUrl: `${window.location.origin}/m/${out.meme.id}`,
    })
  } catch (e) {
    host.settleBusy({ type: 'FAIL', err: mintDeskError(e, copy.errors.mintFailed) })
  }
}
