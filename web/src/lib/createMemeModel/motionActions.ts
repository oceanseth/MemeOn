import { corsFresh } from '../corsFresh'
import { suggestMotion } from '../motionSuggest'
import type { CreateMemeActionHost } from './actionHost'

/* one description per source clip for the page's lifetime: it is asked for at most once */
const asked = new Set<string>()

/**
 * Fill the motion field with what the source clip does, where the browser can tell us for free.
 * Runs in the background and only once a video is what the remix will produce; the field is not
 * on screen until the edited frame is approved, so the model has the whole edit to finish in.
 * Everywhere the model is missing this does nothing and the field stays blank.
 */
export function prefillMotion(host: CreateMemeActionHost): void {
  const owner = host.getOwner()
  if (!owner?.active) return
  const live = host.getCtx()
  const source = live.remixSource
  if (live.remixOutput !== 'video' || source?.mediaType !== 'video' || !source.videoUrl) return
  const { videoUrl } = source
  if (asked.has(videoUrl)) return
  asked.add(videoUrl)
  void suggestMotion(corsFresh(videoUrl), source.title).then((motion) => {
    if (!motion || !owner.active) return
    if (host.getCtx().remixSource?.videoUrl !== videoUrl) return
    host.send({ type: 'SET_MOTION_SUGGESTION', motion })
  })
}

/** Test seam: forget every clip already asked about. */
export function resetMotionPrefill(): void {
  asked.clear()
}
