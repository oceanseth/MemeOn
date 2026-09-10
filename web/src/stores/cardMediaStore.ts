import type { MouseEvent, RefCallback } from 'react'

/**
 * The one genuinely imperative piece of a meme card: an IntersectionObserver, `video.play()`
 * and the paused foil ring. It lives here rather than in lib/memeCardModel.ts so that builder
 * stays a pure props factory — the model hands the card the *stable* handles exported below
 * and this module owns the observer and the per-card play intent.
 *
 * Playback state is not mirrored into React: the media element is the source of truth for
 * "is this playing", exactly as `<dialog open>` is for the modals. The card's own button is
 * kept in step with it, so mouse and screen reader read the same answer.
 */

const videoIn = (card: Element | null): HTMLVideoElement | null =>
  card?.querySelector('video') ?? null

const toggleIn = (card: Element | null): Element | null =>
  card?.querySelector('[data-slot="media-toggle"]') ?? null

/**
 * Manual control wins over the observer for the rest of the card's life: a player who pauses a
 * looping meme does not want it restarted by scrolling past it. Keyed by element, so a card that
 * leaves the page takes its intent with it.
 */
const manualIntent = new WeakMap<HTMLElement, 'playing' | 'paused'>()

/** The button is the single source of truth for "is this card playing", for mouse and screen reader alike. */
function reflectPlaying(card: Element | null, playing: boolean): void {
  toggleIn(card)?.setAttribute('aria-pressed', String(playing))
}

function startCard(card: HTMLElement, video: HTMLVideoElement): void {
  void video.play().then(
    () => reflectPlaying(card, true),
    () => reflectPlaying(card, false),
  )
}

function stopCard(card: HTMLElement, video: HTMLVideoElement): void {
  video.pause()
  reflectPlaying(card, false)
}

/**
 * What one viewport entry does to one card, extracted so the suite can drive it directly:
 * off screen the foil ring is paused (--glow-play-state, already parameterised in
 * atoms/MemeCard.css) and the video is paused. The property is *removed* rather than set to
 * `running` on the way back in, so Paper and Silver keep the paused ring their own tier rule asks for.
 */
export function applyCardVisibility(card: HTMLElement, visible: boolean): void {
  if (visible) card.style.removeProperty('--glow-play-state')
  else card.style.setProperty('--glow-play-state', 'paused')

  const video = videoIn(card)
  if (!video) return
  const intent = manualIntent.get(card)
  const mayPlay = intent === 'playing' || (intent === undefined && card.dataset.mediaAutoplay === 'on')
  if (visible && mayPlay) startCard(card, video)
  else stopCard(card, video)
}

/* Read once, at load: the grid observer outlives every card it watches, so it is built from the
   platform constructor this module started with rather than whatever is on `window` when the
   first card happens to mount. */
const ViewportObserver = typeof IntersectionObserver === 'undefined' ? null : IntersectionObserver

/** One observer for every card on the page — a grid is the product's most repeated object. */
let cardObserver: IntersectionObserver | null = null
/** The observation list, so cards React has unmounted can be released without a per-card closure. */
const observed = new Set<HTMLElement>()

function releaseUnmountedCards(): void {
  for (const card of observed) {
    if (card.isConnected) continue
    cardObserver?.unobserve(card)
    observed.delete(card)
  }
}

function sharedCardObserver(): IntersectionObserver | null {
  if (!ViewportObserver) return null
  cardObserver ??= new ViewportObserver(
    (entries) => {
      releaseUnmountedCards()
      for (const entry of entries) {
        const card = entry.target as HTMLElement
        if (!card.isConnected) continue
        applyCardVisibility(card, entry.isIntersecting)
      }
    },
    { rootMargin: '200px' },
  )
  return cardObserver
}

/**
 * Stable for the life of the module: a fresh closure per built model would change ref identity on
 * every render, so React would unobserve and reobserve every card in the grid each time.
 */
export const cardMediaRef: RefCallback<HTMLElement> = (element) => {
  // React 18 hands back `null`, not the node, on detach, so the sweep above is what releases it
  if (!element) return
  releaseUnmountedCards()
  const observer = sharedCardObserver()
  if (!observer) return
  observer.observe(element)
  observed.add(element)
}

/** The card's own pause/play control. Stable for the same reason as the ref. */
export function toggleCardMedia(event: MouseEvent<HTMLButtonElement>): void {
  const card = event.currentTarget.closest('[data-slot="meme-card"]')
  const video = videoIn(card)
  if (!video || !(card instanceof HTMLElement)) return
  if (video.paused) {
    manualIntent.set(card, 'playing')
    startCard(card, video)
  } else {
    manualIntent.set(card, 'paused')
    stopCard(card, video)
  }
}
