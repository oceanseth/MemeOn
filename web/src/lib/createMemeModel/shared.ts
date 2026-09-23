import { tierFor } from '@memeon/shared/tiers'
import { createMemeCopy as copy } from '../../copy/createMeme'
import {
  boundTitle,
  countTitle,
  TITLE_MAX,
  type CreateMemeContext,
} from '../../stores/createMemeMachine'
import type { CreateMemeCardModel } from './types'

/** Upload ceilings. The field copy and the guard read the same number, so they cannot drift. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export const TAGS_MAX = 5

export const HELP_IDS = {
  title: 'create-title-help',
  tags: 'create-tags-help',
  url: 'create-url-help',
  prompt: 'create-prompt-help',
  uploadImage: 'create-image-help',
  uploadVideo: 'create-video-help',
} as const

const FRESH_TIER = tierFor(0)

const megabytes = (bytes: number): number => Math.max(1, Math.ceil(bytes / (1024 * 1024)))

export function overCapMessage(kind: 'image' | 'video', size: number, cap: number): string {
  const advice =
    kind === 'video' ? copy.preview.overCapAdvice.video : copy.preview.overCapAdvice.image
  return copy.preview.overCap(kind, megabytes(size), megabytes(cap), advice)
}

export function boundTags(value: string): string {
  const parts = value.split(',')
  return parts.length <= TAGS_MAX ? value : parts.slice(0, TAGS_MAX).join(',')
}

export const countTags = (value: string): number =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean).length

export function isRemixOutput(value: string): value is 'image' | 'video' {
  return value === 'image' || value === 'video'
}

export function isVideoRemixStyle(value: string): value is 'edit' | 'restyle' {
  return value === 'edit' || value === 'restyle'
}

export function megabyteLabel(bytes: number): number {
  return megabytes(bytes)
}

function originLabelFor(source: CreateMemeContext['artworkSource']): string | null {
  if (!source) return null
  const provider = source.provider === 'giphy' ? copy.preview.giphyProvider : source.provider
  return source.author
    ? copy.preview.originFromAuthor(provider, source.author)
    : copy.preview.originFrom(provider)
}

/**
 * One card recipe for both the live preview and the minted hold. The box model and foil host
 * belong to `CreateMemeScreen`; this engine names the media, title, and labels.
 */
export function buildCard(ctx: CreateMemeContext): CreateMemeCardModel {
  const title = ctx.title.trim()
  const label = title ? `"${title}"` : copy.preview.yourMeme
  return {
    media: ctx.videoUrl
      ? {
          kind: 'video',
          videoProps: {
            src: ctx.videoUrl,
            poster: ctx.imageUrl || undefined,
            muted: true,
            loop: true,
            playsInline: true,
            autoPlay: true,
            controls: true,
            'aria-label': copy.preview.videoA11y,
          },
        }
      : {
          kind: 'image',
          imageProps: { src: ctx.imageUrl, alt: copy.preview.previewOf(label) },
        },
    title: title || copy.preview.untitled,
    titleIsPlaceholder: !title,
    tierName: FRESH_TIER.name,
    tierLabel: copy.preview.freshlyMinted(FRESH_TIER.name),
    statsLabel: copy.preview.zeroStats,
    valueLabel: copy.preview.zeroValue,
    originLabel: originLabelFor(ctx.artworkSource),
  }
}

export function nextStepFor(err: string | null): string | null {
  if (!err) return null
  if (err === copy.errors.creditsExhausted || /credit|402|quota|balance/i.test(err)) {
    return copy.preview.nextStep.credits
  }
  const rejectedStatus = err.match(/\((\d+)\)/)?.[1]
  if (
    err === copy.errors.uploadFailed ||
    (rejectedStatus !== undefined && err === copy.errors.uploadRejected(Number(rejectedStatus))) ||
    /413|too large/i.test(err)
  ) {
    return copy.preview.nextStep.tooLarge
  }
  return null
}

export function deriveMintState(ctx: CreateMemeContext, isBusy: boolean) {
  const needsVideo = ctx.mode === 'video' || (ctx.mode === 'remix' && ctx.remixOutput === 'video')
  const canMint = !!ctx.title.trim() && !!ctx.imageUrl && (!needsVideo || !!ctx.videoUrl) && !isBusy
  const mintHint = [
    !ctx.title.trim() && copy.preview.mintHint.title,
    !ctx.imageUrl && copy.preview.mintHint.artwork,
    needsVideo &&
      !ctx.videoUrl &&
      (ctx.mode === 'remix' ? copy.preview.mintHint.animate : copy.preview.mintHint.video),
  ]
    .filter(Boolean)
    .join(' · ')
  return { needsVideo, canMint, mintHint }
}

export { boundTitle, countTitle, TITLE_MAX }
