import { cn } from '@/lib/cn'

/**
 * The product's glyph set: 24x24 box, 1.5 stroke, `currentColor`, no fill unless a path opts in.
 *
 * PROVENANCE. The two halves of this set are not the same thing, and the single label that used to
 * paper over the difference ("Central icon family glyphs drawn in the product") is what let a
 * gamepad onto a Discord row through review.
 *
 * Genuine Central, extracted from the Paper file ("MemeOn - Soft Press / Interface Atlas", DS 04 ·
 * Icon families and navigation) in 8f07a8b - twelve glyphs, each one actually drawn in the design:
 *   storefront, book, users, arrows-left-right, trophy, gear, magnifying-glass, circle-plus, bell,
 *   arrow-right, sun, moon.
 * They are identifiable from the data alone: absolute commands, three-decimal beziers, per-path
 * linecap/linejoin, and a circle of radius 9.25 about (12,12) spanning 2.75..21.25 (CENTRAL_RING).
 *
 * Everything below `moon` was hand-added in 9b1454b, in Lucide's idiom, to give the emoji sweep
 * something to swap each character for. Those are stand-ins, not design artefacts: compact relative
 * commands, radius-10 circles spanning 2..22, hard rectangle corners, and dots faked as zero-length
 * round-capped lines. Glyphs since restated on the Central grid carry their own note saying so
 * (circle-check, circle-x, ban, contrast, meh, square, dna, star, globe, mail, film,
 * playing-card, gift, square-play, theater, satellite, handshake); the rest are
 * still the raw import and still read about 8% large beside the twelve. Do not add to this half
 * without rasterising the candidate at the size its call site actually uses - brain is still
 * accepted at the Discord CTA, and unreadability at 16px is exactly how the raw imports got in.
 *
 * DISCORD IS A BRAND MARK, NOT A GLYPH - superseding the note that kept it text-only. The
 * objection there was sound and still is: stroking Discord's logo at 1.5 bloats the silhouette
 * (the eye holes choke to pinpricks at 16px) and modifies a mark its guidelines require be
 * reproduced unmodified. So `discord` is not stroked. It is the official mark, verbatim from
 * simple-icons (CC0 icon data; the mark is Discord's trademark, reproduced unmodified and
 * monochrome, which their brand guidelines permit), carried by the one `brand` PathDef flag:
 * filled with `currentColor`, stroke off. That flag exists for brand marks and nothing else - a
 * product glyph that wants weight uses `filled`, which keeps its outline twin's silhouette.
 * (`brain` on the DiscordPageScreen install CTA is MemeOn's own emoji, not a stand-in for Discord.)
 */
export type IconName =
  | 'storefront'
  | 'book'
  | 'users'
  | 'arrows-left-right'
  | 'trophy'
  | 'gear'
  | 'magnifying-glass'
  | 'circle-plus'
  | 'bell'
  | 'arrow-right'
  | 'sun'
  | 'moon'
  | 'brain'
  | 'sparkles'
  | 'theater'
  | 'handshake'
  | 'wrench'
  | 'eye'
  | 'triangle-alert'
  | 'circle-check'
  | 'eye-off'
  | 'gift'
  | 'link'
  | 'blocks'
  | 'trash-2'
  | 'contrast'
  | 'palette'
  | 'hand'
  | 'dna'
  | 'star'
  | 'hourglass'
  | 'clapperboard'
  | 'film'
  | 'globe'
  | 'playing-card'
  | 'scroll-text'
  | 'upload'
  | 'satellite'
  | 'mail'
  | 'volume-x'
  | 'volume-2'
  | 'rotate-cw'
  | 'download'
  | 'medal'
  | 'play'
  | 'square-play'
  | 'circle-x'
  | 'ban'
  | 'square'
  | 'meh'
  | 'chevron-down'
  | 'x'
  | 'star-filled'
  | 'arrows-swap'
  | 'user'
  | 'code'
  | 'discord'
  | 'log-out'

export const ICON_NAMES: readonly IconName[] = [
  'storefront',
  'book',
  'users',
  'arrows-left-right',
  'trophy',
  'gear',
  'magnifying-glass',
  'circle-plus',
  'bell',
  'arrow-right',
  'sun',
  'moon',
  'brain',
  'sparkles',
  'theater',
  'handshake',
  'wrench',
  'eye',
  'triangle-alert',
  'circle-check',
  'eye-off',
  'gift',
  'link',
  'blocks',
  'trash-2',
  'contrast',
  'palette',
  'hand',
  'dna',
  'star',
  'hourglass',
  'clapperboard',
  'film',
  'globe',
  'playing-card',
  'scroll-text',
  'upload',
  'satellite',
  'mail',
  'volume-x',
  'volume-2',
  'rotate-cw',
  'download',
  'medal',
  'play',
  'square-play',
  'circle-x',
  'ban',
  'square',
  'meh',
  'chevron-down',
  'x',
  'star-filled',
  'arrows-swap',
  'user',
  'code',
  'discord',
  'log-out',
]

export interface PathDef {
  d: string
  linecap?: 'round'
  linejoin?: 'round'
  /** Paint the interior as well as the outline. Solid/outline toggle pairs use this so the
      filled member reuses its outline twin's exact `d` and the glyph does not jump when the
      toggle flips. `contrast` is a single auto-theme mark: only its half-disc is filled. */
  filled?: true
  /** A brand mark: filled with `currentColor` and *not* stroked, because a logo is reproduced as
      drawn or not at all. `discord` is the only one, and the header note says why. */
  brand?: true
}

/**
 * The Central circle: radius 9.25 about (12,12), four absolute cubics whose handles sit at
 * 0.5523r — lifted verbatim from `circle-plus`, the one ring in this file that came out of the
 * Paper file. Every badge that wants a ring shares this constant instead of re-typing it, because
 * `circle-check`, `circle-x` and `ban` render side by side as trade statuses (lib/tradeCardModel)
 * and any drift between them shows up as three badges that don't quite line up. `circle-plus`
 * keeps its ring inline: its `d` welds ring and plus into a single path and that path is the
 * untouched design export, so it is left exactly as extracted.
 */
export const CENTRAL_RING =
  'M21.25 12C21.25 17.109 17.109 21.25 12 21.25C6.891 21.25 2.75 17.109 2.75 12C2.75 6.891 6.891 2.75 12 2.75C17.109 2.75 21.25 6.891 21.25 12Z'

/** Byte-identical to the original `square` d (3.75..20.25, corner 2.75). Remainder squares alias this. */
export const CENTRAL_BOX =
  'M6.5 3.75H17.5C19.019 3.75 20.25 4.981 20.25 6.5V17.5C20.25 19.019 19.019 20.25 17.5 20.25H6.5C4.981 20.25 3.75 19.019 3.75 17.5V6.5C3.75 4.981 4.981 3.75 6.5 3.75Z'

const CENTRAL_CORNER = 2.75
const KAPPA = 0.5523

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** Non-square remainder boxes. Kappa 0.5523, 3-decimal Central cubics, corner 2.75. */
function roundedRect(minX: number, minY: number, maxX: number, maxY: number): string {
  const r = CENTRAL_CORNER
  const k = round3(KAPPA * r)
  const left = round3(minX + r)
  const right = round3(maxX - r)
  const top = round3(minY + r)
  const bottom = round3(maxY - r)
  const x0 = round3(minX)
  const y0 = round3(minY)
  const x1 = round3(maxX)
  const y1 = round3(maxY)
  return `M${left} ${y0}H${right}C${round3(right + k)} ${y0} ${x1} ${round3(top - k)} ${x1} ${top}V${bottom}C${x1} ${round3(bottom + k)} ${round3(right + k)} ${y1} ${right} ${y1}H${left}C${round3(left - k)} ${y1} ${x0} ${round3(bottom + k)} ${x0} ${bottom}V${top}C${x0} ${round3(top - k)} ${round3(left - k)} ${y0} ${left} ${y0}Z`
}

const PATHS: Record<IconName, readonly PathDef[]> = {
  storefront: [
    {
      d: 'M20.25 11.409V18.25C20.25 19.355 19.355 20.25 18.25 20.25H5.75C4.645 20.25 3.75 19.355 3.75 18.25V11.409',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M9.5 3.75H14.5M9.5 3.75L8.909 8.774C8.692 10.624 10.137 12.25 12 12.25C13.863 12.25 15.309 10.624 15.091 8.774L14.5 3.75M9.5 3.75H5.886C5.012 3.75 4.239 4.317 3.977 5.151L2.973 8.354C2.367 10.285 3.809 12.25 5.834 12.25C7.354 12.25 8.634 11.112 8.812 9.602L9.5 3.75ZM14.5 3.75H18.115C18.989 3.75 19.762 4.317 20.023 5.151L21.028 8.354C21.634 10.285 20.191 12.25 18.167 12.25C16.646 12.25 15.366 11.112 15.189 9.602L14.5 3.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  book: [
    {
      d: 'M10.625 7.177L10.855 4.989C10.97 3.891 11.955 3.094 13.053 3.209L19.02 3.836C20.119 3.952 20.916 4.936 20.8 6.034L19.86 14.985C19.744 16.084 18.76 16.881 17.661 16.765L14.002 16.38',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M3.162 10.034C3.047 8.936 3.844 7.952 4.942 7.836L10.909 7.209C12.008 7.094 12.992 7.891 13.107 8.989L14.048 17.94C14.164 19.038 13.367 20.022 12.268 20.138L6.301 20.765C5.203 20.881 4.218 20.084 4.103 18.985L3.162 10.034Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  users: [
    {
      d: 'M9.25 9.75C7.317 9.75 5.75 8.183 5.75 6.25C5.75 4.317 7.317 2.75 9.25 2.75C11.183 2.75 12.75 4.317 12.75 6.25C12.75 8.183 11.183 9.75 9.25 9.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M15 2.75C16.933 2.75 18.5 4.317 18.5 6.25C18.5 8.183 16.933 9.75 15 9.75',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M9.248 12.75C5.464 12.75 2.275 15.152 1.303 18.25C0.972 19.303 1.893 20.219 2.998 20.219H15.498C16.603 20.219 17.524 19.303 17.194 18.25C16.221 15.152 13.032 12.75 9.248 12.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M20.75 20.25H21.25C22.355 20.25 23.275 19.335 22.941 18.282C22.26 16.139 20.512 14.31 18.25 13.509',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'arrows-left-right': [
    {
      d: 'M17.5 2.75L19.97 5.22C20.263 5.513 20.263 5.987 19.97 6.28L17.5 8.75',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M6.5 21.25L4.03 18.78C3.737 18.487 3.737 18.013 4.03 17.72L6.5 15.25',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M5.25 18.25H18.25C19.355 18.25 20.25 17.355 20.25 16.25V13.25',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M3.75 10.25V7.75C3.75 6.645 4.645 5.75 5.75 5.75H18.75',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  trophy: [
    { d: 'M12 18V15', linejoin: 'round' },
    {
      d: 'M18.25 4.75H19.25C20.355 4.75 21.25 5.645 21.25 6.75V7.25C21.25 8.907 19.907 10.25 18.25 10.25',
      linejoin: 'round',
    },
    {
      d: 'M5.75 4.75C5.75 3.645 6.645 2.75 7.75 2.75H16.25C17.355 2.75 18.25 3.645 18.25 4.75V9.25C18.25 12.564 15.564 15.25 12.25 15.25H11.75C8.436 15.25 5.75 12.564 5.75 9.25V4.75Z',
      linejoin: 'round',
    },
    {
      d: 'M6.75 19.25C6.75 18.422 7.422 17.75 8.25 17.75H15.75C16.578 17.75 17.25 18.422 17.25 19.25V19.75C17.25 20.578 16.578 21.25 15.75 21.25H8.25C7.422 21.25 6.75 20.578 6.75 19.75V19.25Z',
      linejoin: 'round',
    },
    {
      d: 'M5.75 4.75H4.75C3.645 4.75 2.75 5.645 2.75 6.75V7.25C2.75 8.907 4.093 10.25 5.75 10.25',
      linejoin: 'round',
    },
  ],
  gear: [
    {
      d: 'M7.878 5.214L7.175 5.052C6.58 4.915 5.957 5.093 5.525 5.525C5.093 5.957 4.915 6.58 5.052 7.175L5.214 7.878C5.401 8.689 5.067 9.53 4.375 9.992L3.52 10.562C3.039 10.883 2.75 11.422 2.75 12C2.75 12.578 3.039 13.117 3.52 13.438L4.375 14.008C5.067 14.47 5.401 15.311 5.214 16.122L5.052 16.825C4.915 17.42 5.093 18.043 5.525 18.475C5.957 18.907 6.58 19.085 7.175 18.948L7.878 18.786C8.689 18.599 9.53 18.933 9.992 19.625L10.562 20.48C10.883 20.961 11.422 21.25 12 21.25C12.578 21.25 13.117 20.961 13.438 20.48L14.008 19.625C14.47 18.933 15.311 18.599 16.122 18.786L16.825 18.948C17.42 19.085 18.043 18.907 18.475 18.475C18.907 18.043 19.085 17.42 18.948 16.825L18.786 16.122C18.599 15.311 18.933 14.47 19.625 14.008L20.48 13.438C20.961 13.117 21.25 12.578 21.25 12C21.25 11.422 20.961 10.883 20.48 10.562L19.625 9.992C18.933 9.53 18.599 8.689 18.786 7.878L18.948 7.175C19.085 6.58 18.907 5.957 18.475 5.525C18.043 5.093 17.42 4.915 16.825 5.052L16.122 5.214C15.311 5.401 14.47 5.067 14.008 4.375L13.438 3.52C13.117 3.039 12.578 2.75 12 2.75C11.422 2.75 10.883 3.039 10.562 3.52L9.992 4.375C9.53 5.067 8.689 5.401 7.878 5.214Z',
      linejoin: 'round',
    },
    {
      d: 'M14.75 12C14.75 13.519 13.519 14.75 12 14.75C10.481 14.75 9.25 13.519 9.25 12C9.25 10.481 10.481 9.25 12 9.25C13.519 9.25 14.75 10.481 14.75 12Z',
      linejoin: 'round',
    },
  ],
  'magnifying-glass': [
    {
      d: 'M20.25 20.25L16.127 16.127M16.127 16.127C17.439 14.815 18.25 13.002 18.25 11C18.25 6.996 15.004 3.75 11 3.75C6.996 3.75 3.75 6.996 3.75 11C3.75 15.004 6.996 18.25 11 18.25C13.002 18.25 14.815 17.439 16.127 16.127Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'circle-plus': [
    {
      d: 'M16.243 12.001H7.757M12 16.243V7.758M21.25 12C21.25 17.109 17.109 21.25 12 21.25C6.891 21.25 2.75 17.109 2.75 12C2.75 6.891 6.891 2.75 12 2.75C17.109 2.75 21.25 6.891 21.25 12Z',
      linecap: 'round',
    },
  ],
  bell: [
    {
      d: 'M4.473 9.402C4.943 5.603 8.172 2.75 12 2.75C15.828 2.75 19.057 5.603 19.527 9.402L20.222 15.004C20.369 16.197 19.439 17.25 18.237 17.25H5.763C4.561 17.25 3.631 16.197 3.778 15.004L4.473 9.402Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M16 17.25C16 19.459 14.209 21.25 12 21.25C9.791 21.25 8 19.459 8 17.25',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'arrow-right': [
    { d: 'M14 5.75L20.25 12L14 18.25', linecap: 'round', linejoin: 'round' },
    { d: 'M19.5 12H3.75', linecap: 'round', linejoin: 'round' },
  ],
  sun: [
    {
      d: 'M11.998 3.291V1.768M5.84 18.159L4.763 19.236M11.998 22.233V20.709M19.233 4.765L18.156 5.842M20.707 12H22.23M18.156 18.159L19.233 19.236M1.766 12H3.289M4.763 4.765L5.84 5.842M15.71 8.288C17.761 10.338 17.761 13.662 15.71 15.712C13.66 17.763 10.336 17.763 8.286 15.712C6.235 13.662 6.235 10.338 8.286 8.288C10.336 6.238 13.66 6.238 15.71 8.288Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  moon: [
    {
      d: 'M21.248 11.811C20.189 12.56 18.896 13 17.5 13C13.91 13 11 10.09 11 6.5C11 5.104 11.44 3.811 12.189 2.752C12.126 2.751 12.063 2.75 12 2.75C6.891 2.75 2.75 6.891 2.75 12C2.75 17.109 6.891 21.25 12 21.25C17.109 21.25 21.25 17.109 21.25 12C21.25 11.937 21.249 11.874 21.248 11.811Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],

  brain: [
    { d: 'M12 18V5' },
    { d: 'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4' },
    { d: 'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5' },
    { d: 'M17.997 5.125a4 4 0 0 1 2.526 5.77' },
    { d: 'M18 18a4 4 0 0 0 2-7.464' },
    { d: 'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517' },
    { d: 'M6 18a4 4 0 0 1-2-7.464' },
    { d: 'M6.003 5.125a4 4 0 0 0-2.526 5.77' },
  ],
  sparkles: [
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    },
    { d: 'M20 2v4' },
    { d: 'M22 4h-4' },
    { d: 'M 2 20 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0' },
  ],
  // Comedy/tragedy masks on the Central grid (Invite's accept mark). Lucide's curtains were nine
  // hairlines that vanished at the 16px the Join row actually uses; two ovals + mouths keep the
  // 🎭 reading and the name `theater`.
  theater: [
    {
      d: 'M11.75 12C11.75 16.556 9.735 20.25 7.25 20.25C4.765 20.25 2.75 16.556 2.75 12C2.75 7.444 4.765 3.75 7.25 3.75C9.735 3.75 11.75 7.444 11.75 12Z',
      linejoin: 'round',
    },
    { d: 'M5.25 14.75C6.25 17.25 8.25 17.25 9.25 14.75', linecap: 'round' },
    {
      d: 'M21.25 12C21.25 16.556 19.235 20.25 16.75 20.25C14.265 20.25 12.25 16.556 12.25 12C12.25 7.444 14.265 3.75 16.75 3.75C19.235 3.75 21.25 7.444 21.25 12Z',
      linejoin: 'round',
    },
    { d: 'M14.75 15.75C15.75 13.25 17.75 13.25 18.75 15.75', linecap: 'round' },
  ],
  // Two hands meeting. Lucide's five-path clasp collapsed to noise at 16px (Invite accept) and
  // 18px (Profile chip). Thumbs keep it from reading as a chevron; nothing shorter than ~4 units.
  handshake: [
    {
      d: 'M2.75 16.25C2.75 13.5 5 12 7.75 12H12.25C14 12 14.75 13.25 14.75 14.75C14.75 17.25 12.75 19.5 10 19.5H7.5C4.75 19.5 2.75 17.5 2.75 16.25Z',
      linejoin: 'round',
    },
    {
      d: 'M21.25 16.25C21.25 13.5 19 12 16.25 12H11.75C10 12 9.25 13.25 9.25 14.75C9.25 17.25 11.25 19.5 14 19.5H16.5C19.25 19.5 21.25 17.5 21.25 16.25Z',
      linejoin: 'round',
    },
    {
      d: 'M11.5 12.15C10.25 9.25 8.25 6.75 6.25 6.25M12.5 12.15C13.75 9.25 15.75 6.75 17.75 6.25',
      linecap: 'round',
    },
  ],
  wrench: [
    {
      d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z',
    },
  ],
  eye: [
    {
      d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
    },
    { d: 'M 9 12 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0' },
  ],
  'triangle-alert': [
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    },
    { d: 'M12 9v4' },
    { d: 'M12 17h.01' },
  ],
  // The tick is the imported Lucide check restated on the Central grid: its two arms keep their
  // 45deg angles and their length ratio, scaled 1.0607 so the horizontal extent lands on 7.757 and
  // 16.243 — the exact coordinates of `circle-plus`'s crossbar. Central sets its interior marks
  // larger against the ring than Lucide does (4.243/9.25 vs 4/10), so a plain 0.925 shrink to fit
  // the smaller ring would have left the tick visibly lighter than the plus it sits beside.
  'circle-check': [
    { d: CENTRAL_RING, linecap: 'round' },
    {
      d: 'M7.757 12L10.409 14.652L16.243 8.818',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'eye-off': [
    {
      d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
    },
    { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' },
    {
      d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
    },
    { d: 'm2 2 20 20' },
  ],
  // Lid+body on a Central rounded box (corner 2.75, long side 16.5); bow scaled into the
  // leftover 3.75..8.5 band so the 16px quest-bar/Friends mark still reads as a gift.
  gift: [
    { d: roundedRect(3.75, 8.5, 20.25, 20.25), linejoin: 'round' },
    { d: 'M3.75 12H20.25', linecap: 'round' },
    { d: 'M12 8.5V20.25', linecap: 'round' },
    {
      d: 'M12 8.5C7.75 8.5 6.5 3.75 9.75 3.75C12.25 3.75 12.75 6.75 12 8.5C11.25 6.75 11.75 3.75 14.25 3.75C17.5 3.75 16.25 8.5 12 8.5',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  link: [
    { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  ],
  blocks: [
    {
      d: 'M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2',
    },
    { d: 'M 14 2 H 22 V 10 H 14 Z' },
  ],
  'trash-2': [
    { d: 'M10 11v6' },
    { d: 'M14 11v6' },
    { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' },
    { d: 'M3 6h18' },
    { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
  ],
  // Ring plus the half-disc, the disc held at 0.6 of the ring (5.55 against 9.25) exactly as the
  // imported version held 6 against 10, so the light/dark split reads at the same ratio. The
  // half-disc is two cubics closed by `Z`; the closing segment IS the vertical diameter, which is
  // why it must stay a closed subpath and not a pair of open arcs. Filled so the D carries at the
  // 16/22px theme-control sizes; the ring stays a stroke.
  contrast: [
    { d: CENTRAL_RING, linecap: 'round' },
    {
      d: 'M12 17.55C15.065 17.55 17.55 15.065 17.55 12C17.55 8.935 15.065 6.45 12 6.45Z',
      filled: true,
      linejoin: 'round',
    },
  ],
  palette: [
    {
      d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
    },
    { d: 'M 13 6.5 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0' },
    { d: 'M 17 10.5 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0' },
    { d: 'M 6 12.5 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0' },
    { d: 'M 8 7.5 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0' },
  ],
  hand: [
    { d: 'M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2' },
    { d: 'M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2' },
    { d: 'M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8' },
    {
      d: 'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
    },
  ],
  // Remix. The imported helix was eleven separate hairlines on a diagonal — four of them under two
  // units long — and it collapsed into noise at the 14px the Remix action actually renders at
  // (screens/MemeDetailScreen, hooks/useMemeDetailScreen). Redrawn upright as two strands and three
  // rungs: eleven paths become five, and nothing is shorter than 4.9 units.
  //
  // Each strand is one cosine period across Central's 2.75..21.25 span, amplitude 4.25, written as
  // two cubics whose y-handles are evenly spaced (so y runs linearly in t and the two strands cross
  // exactly at 7.375 and 16.625). The rungs' x values are the strands' real positions at those
  // heights — 9.557/14.443 solved off the curve, 7.75/16.25 at the waist where the bow peaks — so
  // every rung lands on the strands instead of floating short of them.
  dna: [
    {
      d: 'M16.25 2.75C16.25 5.833 7.75 8.917 7.75 12C7.75 15.083 16.25 18.167 16.25 21.25',
      linecap: 'round',
    },
    {
      d: 'M7.75 2.75C7.75 5.833 16.25 8.917 16.25 12C16.25 15.083 7.75 18.167 7.75 21.25',
      linecap: 'round',
    },
    {
      d: 'M9.557 5.5H14.443M7.75 12H16.25M9.557 18.5H14.443',
      linecap: 'round',
    },
  ],
  // Redrawn off the Central construction (outer r 9.25 about a centre nudged to 12.55 so the
  // bottom points and the apex balance optically) rather than kept as the imported rounded star:
  // `star-filled` has to be the *same* contour, and a contour whose corners are already rounded
  // by 2.12u beziers loses those corners entirely once the interior is painted.
  star: [
    {
      d: 'M12 3.3L14.61 8.958L20.797 9.692L16.223 13.922L17.437 20.033L12 16.99L6.563 20.033L7.777 13.922L3.203 9.692L9.39 8.958Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  hourglass: [
    { d: 'M5 22h14' },
    { d: 'M5 2h14' },
    {
      d: 'M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22',
    },
    {
      d: 'M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2',
    },
  ],
  clapperboard: [
    { d: 'm12.296 3.464 3.02 3.956' },
    {
      d: 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z',
    },
    { d: 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { d: 'm6.18 5.276 3.1 3.899' },
  ],
  // Outer box is CENTRAL_BOX; Lucide sprockets scaled 16.5/18 into 3.75..20.25 so they sit on the
  // flat sides and do not poke the 2.75 corners.
  film: [
    { d: CENTRAL_BOX, linejoin: 'round' },
    {
      d: 'M7.417 3.75V20.25M16.583 3.75V20.25M3.75 12H20.25M3.75 7.875H7.417M3.75 16.125H7.417M16.583 7.875H20.25M16.583 16.125H20.25',
      linecap: 'round',
    },
  ],
  // Ring is CENTRAL_RING; meridians and equator scaled onto the same 2.75..21.25 span so the
  // r=10 Lucide ellipse does not sit around a r=9.25 ring.
  globe: [
    { d: CENTRAL_RING, linecap: 'round' },
    {
      d: 'M12 2.75a13.413 13.413 0 0 0 0 18.5 13.413 13.413 0 0 0 0-18.5',
      linecap: 'round',
    },
    { d: 'M2.75 12H21.25', linecap: 'round' },
  ],
  // Portrait card: same 2.75 corner, height capped at 16.5, width scaled off Lucide's 14×20.
  'playing-card': [
    { d: roundedRect(6.225, 3.75, 17.775, 20.25), linejoin: 'round' },
    { d: 'M12 8.95L14.35 12L12 15.05L9.65 12Z', linejoin: 'round' },
  ],
  'scroll-text': [
    { d: 'M15 12h-5' },
    { d: 'M15 8h-5' },
    { d: 'M19 17V5a2 2 0 0 0-2-2H4' },
    {
      d: 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
    },
  ],
  upload: [
    { d: 'M12 3v12' },
    { d: 'm17 8-5-5-5 5' },
    { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
  ],
  // Dish + beam. Lucide's five-path satellite (panels, dish, nested signal arcs) was unreadable
  // at the 16px MemeDetail row. Three strokes, nothing shorter than dna's ~5 unit floor.
  satellite: [
    { d: 'M2.75 20.25A13 13 0 0 0 21.25 3.75', linecap: 'round' },
    { d: 'M8.75 16.5L13.5 11.25', linecap: 'round' },
    { d: 'M15.5 7.75L18.5 4.75M17.25 9.5L21 5.75', linecap: 'round' },
  ],
  // Landscape envelope on the Central corner; Lucide 20×16 scaled onto long side 16.5.
  mail: [
    { d: roundedRect(3.75, 5.4, 20.25, 18.6), linejoin: 'round' },
    { d: 'M20.25 8.15L12 13.2L3.75 8.15', linecap: 'round', linejoin: 'round' },
  ],
  'volume-x': [
    {
      d: 'M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z',
    },
    { d: 'm16.5 14.5 5-5' },
    { d: 'm16.5 9.5 5 5' },
  ],
  'volume-2': [
    {
      d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
    },
    { d: 'M16 9a5 5 0 0 1 0 6' },
    { d: 'M19.364 18.364a9 9 0 0 0 0-12.728' },
  ],
  'rotate-cw': [{ d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' }, { d: 'M21 3v5h-5' }],
  download: [
    { d: 'M12 15V3' },
    { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { d: 'm7 10 5 5 5-5' },
  ],
  medal: [
    {
      d: 'M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15',
    },
    { d: 'M11 12 5.12 2.2' },
    { d: 'm13 12 5.88-9.8' },
    { d: 'M8 7h8' },
    { d: 'M 7 17 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0' },
  ],
  play: [
    {
      d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z',
    },
  ],
  'square-play': [
    { d: CENTRAL_BOX, linejoin: 'round' },
    { d: 'M9.25 8.25L16.25 12L9.25 15.75Z', linejoin: 'round' },
  ],
  // Same 1.0607 interior scale as `circle-check`, which puts the cross's arms on +/-3.182 — the x
  // positions `meh` uses for its eyes. Kept as two independent strokes: crossing them as one
  // polyline would put a round linejoin at the centre and swell the waist at badge sizes.
  'circle-x': [
    { d: CENTRAL_RING, linecap: 'round' },
    { d: 'M15.182 8.818L8.818 15.182', linecap: 'round' },
    { d: 'M8.818 8.818L15.182 15.182', linecap: 'round' },
  ],
  // The bar is a true diameter, not an interior mark, so it is not scaled with the others: its ends
  // sit on the ring at 45deg (9.25/sqrt2 = 6.541 either side of centre). The 0.75 round cap then
  // lands exactly on the ring's outer edge at 10.0, so the slash finishes flush with the ring
  // rather than stopping short of it or spilling past it.
  ban: [
    { d: CENTRAL_RING, linecap: 'round' },
    { d: 'M5.459 5.459L18.541 18.541', linecap: 'round' },
  ],
  // The unchecked half of the quest checkbox (molecules/quest-bar), rendered at 18px next to
  // `circle-check` at 18px. It was an 18x18 box with square corners — the only hard corner in the
  // set, and a corner-to-corner reach of 12.7 against the ring's 9.25, which made the empty state
  // read heavier than the done state. Now 16.5 across on Central's 3.75..20.25 span (the same box
  // `storefront`'s body sits in) with a 2.75 corner (`gear`'s inner radius): ~89% of the ring's
  // diameter, which is what it takes for a square to carry the same optical weight as a circle.
  square: [{ d: CENTRAL_BOX, linejoin: 'round' }],
  // Face on the Central ring, features on the same 1.0607 interior scale as the rest of the family:
  // the mouth spans 7.757..16.243 (the `circle-plus` crossbar again) at y 16.243 (its lower arm
  // tip), and the eyes sit on 8.818/15.182 (`circle-x`'s arms). Both eyes are one path — they are
  // one feature and always move together.
  meh: [
    { d: CENTRAL_RING, linecap: 'round' },
    { d: 'M8.818 9.879V8.818M15.182 9.879V8.818', linecap: 'round' },
    { d: 'M7.757 16.243H16.243', linecap: 'round' },
  ],

  // The disclosure caret, drawn as `arrow-right`'s head rotated a quarter turn so the two share a
  // corner angle. One direction is enough: the FAQ trigger already spins its indicator 180deg off
  // `data-panel-open`, so an open panel is this glyph rotated, not a separate `chevron-up`.
  'chevron-down': [
    {
      d: 'M5.75 8.875L12 15.125L18.25 8.875',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  // Bare close mark. Two independent strokes rather than one crossed polyline, because a polyline
  // puts a join at the centre and the round linejoin swells the waist into a blob at 16px. Held to
  // a 10.5u span (well inside the 2.75..21.25 box) so it reads as a mark inside the dialog's 40px
  // close well instead of filling it.
  x: [
    { d: 'M6.75 6.75L17.25 17.25', linecap: 'round' },
    { d: 'M17.25 6.75L6.75 17.25', linecap: 'round' },
  ],
  // Solid companion for `star`, for the follow toggle's off/on pair. Deliberately the identical
  // `d`: filled *and* stroked, it occupies the same silhouette as the outline, so following a
  // profile darkens the star in place instead of resizing it.
  'star-filled': [
    {
      d: 'M12 3.3L14.61 8.958L20.797 9.692L16.223 13.922L17.437 20.033L12 16.99L6.563 20.033L7.777 13.922L3.203 9.692L9.39 8.958Z',
      filled: true,
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  // Trade/swap. Two free-standing arrows passing each other in opposite directions — no connecting
  // corner, because the moment the two shafts are joined the glyph becomes a loop and collides
  // with `arrows-left-right` (rectangular loop) and `refresh-cw` (circular loop), both of which
  // mean *reshare*. Open ends are the whole point: at 16px the eye reads closed-vs-open long
  // before it reads which way the arrowheads face.
  'arrows-swap': [
    { d: 'M17 5.75L20.25 9L17 12.25', linecap: 'round', linejoin: 'round' },
    { d: 'M19.75 9H3.75', linecap: 'round' },
    { d: 'M7 11.75L3.75 15L7 18.25', linecap: 'round', linejoin: 'round' },
    { d: 'M4.25 15H20.25', linecap: 'round' },
  ],
  // One person, for the account menu's own row. `users` is Friends' mark and reusing it there
  // would recreate the one-glyph-two-meanings fault the icon audit existed to fix; this is the
  // single-person mark that gap asked for. Lucide's circle is written as two arcs because this
  // set renders `<path>` and nothing else.
  user: [
    {
      d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  // Developers: the angle brackets, not a wrench - `gear` is Settings and sits one row above, and
  // two tool marks in a five-row menu read as two settings rows.
  code: [
    { d: 'M16 18L22 12L16 6', linecap: 'round', linejoin: 'round' },
    { d: 'M8 6L2 12L8 18', linecap: 'round', linejoin: 'round' },
  ],
  'log-out': [
    { d: 'M16 17L21 12L16 7', linecap: 'round', linejoin: 'round' },
    { d: 'M21 12H9', linecap: 'round', linejoin: 'round' },
    {
      d: 'M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  // The official mark, unmodified: filled, never stroked (see the header note).
  discord: [
    {
      d: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
      brand: true,
    },
  ],
}

export function iconPaths(name: IconName): readonly PathDef[] {
  return PATHS[name]
}

export interface IconProps {
  name: IconName
  size?: number
  className?: string
  title?: string
}

export function Icon({ name, size = 22, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      data-slot="icon"
      className={cn('inline-block shrink-0', className)}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name].map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill={path.filled || path.brand ? 'currentColor' : 'none'}
          stroke={path.brand ? 'none' : undefined}
          strokeLinecap={path.linecap}
          strokeLinejoin={path.linejoin}
        />
      ))}
    </svg>
  )
}
