/** Persisted Dynamo row. Hydration fields (tier, value, views, …) are not on this record. */

export interface Listing {
  sellerId: string
  pricePerShare: number
  shares: number
}

export interface Meme {
  id: string
  title: string
  description: string | null
  mediaType: 'image' | 'video'
  /** primary still image (card art / og compositing source) */
  imageUrl: string
  videoUrl: string | null
  tags: string[]
  creatorId: string
  creatorName: string
  ownerId: string
  ownerName: string
  reshares: number
  tierKey: string
  listing: Listing | null
  createdAt: string
  /** total like count (ADD-maintained; may be absent on old items) */
  likes?: number
  /** distinct external referrer sources — the true "reshares" metric */
  uniqueRefs?: number
  /** id of the meme this was remixed from */
  remixOf?: string | null
  /** hidden from marketplace/feed/others (sole-owner soft delete) */
  private?: boolean
  /** intrinsic pixel width of `imageUrl` (server-measured; absent on legacy memes) */
  width?: number
  /** intrinsic pixel height of `imageUrl` (server-measured; absent on legacy memes) */
  height?: number
  /** external origin attribution (e.g. seeded from Giphy) */
  source?: {
    provider: string
    id: string
    url: string
    author: string | null
  } | null
}
