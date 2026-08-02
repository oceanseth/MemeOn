import { useMemo } from 'react'
import type { Listing, Meme } from '../types'

const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

/**
 * Foil modifiers a tier earns — domain mechanism, not styling policy: which
 * tiers shimmer is a product rule. The caller decides what to do with them.
 */
export function tierClasses(tierKey: string): string {
  const sheen = SHEEN_TIERS.has(tierKey) ? ' sheen' : ''
  const sparkle = tierKey === 'shiny' ? ' sparkle' : ''
  return `tier-${tierKey}${sheen}${sparkle}`
}

/**
 * Mechanism for a meme trading card: media selection, listing gating, and
 * every formatted stat. Returns data and behaviour only — the caller owns all
 * markup, classes and styling.
 */
export function useMemeCard({ meme }: { meme: Meme }) {
  return useMemo(() => {
    const isVideo = meme.mediaType === 'video' && !!meme.videoUrl
    const listing: Listing | null = meme.listing && meme.listing.shares > 0 ? meme.listing : null

    return {
      /** foil modifiers for this tier, e.g. `tier-shiny sheen sparkle` */
      tierClass: tierClasses(meme.tier.key),
      isVideo,
      listing,
      title: meme.title,
      tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`,
      tierColor: meme.tier.color,
      viewsLabel: (meme.views ?? meme.reshares).toLocaleString(),
      resharesLabel: (meme.reshareCount ?? 0).toLocaleString(),
      valueLabel: meme.value.toLocaleString(),
      listingLabel: listing ? `${listing.shares} sh @ 🧠${listing.pricePerShare}` : null,

      linkProps: { to: `/m/${meme.id}` },
      videoProps: {
        src: meme.videoUrl ?? undefined,
        poster: meme.imageUrl,
        muted: true,
        loop: true,
        playsInline: true,
        autoPlay: true,
      },
      imageProps: { src: meme.imageUrl, alt: meme.title },
    }
  }, [meme])
}
