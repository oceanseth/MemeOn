/**
 * The two brand faces, as satori wants them.
 *
 * Satori reads ttf/otf/woff (never woff2), and fontsource ships one file per unicode subset.
 * Registering several subsets under one family name does NOT chain them — satori matches a family
 * once and then draws tofu for anything that file is missing. A *font stack* does chain, per
 * glyph, so each subset is registered as its own family and `FAMILY_*` spells the stack out.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { FONT } from './theme'

const require = createRequire(import.meta.url)

/** latin first — the common case resolves on the first file and never walks the stack. */
const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'vietnamese'] as const
type Subset = (typeof SUBSETS)[number]

const familyName = (face: string, subset: Subset): string =>
  subset === 'latin' ? face : `${face} ${subset}`

/** `fontFamily` values for the cards: the whole ladder, latin first. */
export const FAMILY_SANS = SUBSETS.map((s) => familyName(FONT.sans, s)).join(', ')
export const FAMILY_DISPLAY = [...SUBSETS.map((s) => familyName(FONT.display, s)), FAMILY_SANS].join(', ')

/**
 * Onest carries the UI weights; Unbounded is the display face and, per the type block in
 * `web/src/index.css`, only ever 400 (the step weight) and 500 (the wordmark and the hero) —
 * 700 does not exist in this typeset.
 */
const FACES: { face: string; pkg: string; slug: string; weights: FontWeight[] }[] = [
  { face: FONT.sans, pkg: '@fontsource/onest', slug: 'onest', weights: [400, 500, 600] },
  { face: FONT.display, pkg: '@fontsource/unbounded', slug: 'unbounded', weights: [400, 500] },
]

/** satori's own weight vocabulary — the nine CSS steps, as literals. */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export interface OgFont {
  name: string
  data: Buffer
  weight: FontWeight
  style: 'normal'
}

/**
 * Bundled next to the lambda handler (`pnpm --filter memeon-api package`); straight out of
 * node_modules when running locally. Mirrors `fontPath` in `og.ts`.
 */
function fontFile(pkg: string, file: string): string {
  const root = process.env.LAMBDA_TASK_ROOT
  return root ? `${root}/fonts/${file}` : require.resolve(`${pkg}/files/${file}`)
}

/** Every (face, weight, subset) the cards can ask for, as one flat list. */
export function fontManifest(): { name: string; weight: FontWeight; pkg: string; file: string }[] {
  return FACES.flatMap(({ face, pkg, slug, weights }) =>
    weights.flatMap((weight) =>
      SUBSETS.map((subset) => ({
        name: familyName(face, subset),
        weight,
        pkg,
        file: `${slug}-${subset}-${weight}-normal.woff`,
      })),
    ),
  )
}

// Read once per warm lambda: ~250 KB of woff that never changes.
let loaded: Promise<OgFont[]> | null = null

export function loadFonts(): Promise<OgFont[]> {
  loaded ??= Promise.all(
    fontManifest().map(async ({ name, weight, pkg, file }) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(fontFile(pkg, file)),
    })),
  )
  return loaded
}
