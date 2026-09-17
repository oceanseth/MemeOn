/**
 * Ratchet: every hex in `src/og/theme.ts` still equals the token it claims.
 *
 * The share cards are SVG, and SVG has no `oklch()`, no `light-dark()` and no custom properties,
 * so `theme.ts` carries the dark arm of `web/src/index.css` resolved to sRGB by hand. This reads
 * both files back and fails when they disagree — the one thing hand-resolved colour needs.
 *
 *   pnpm --filter memeon-api run check-palette
 */
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const cssPath = resolve(repoRoot, 'web/src/index.css')
const themePath = resolve(repoRoot, 'api/src/og/theme.ts')

/**
 * Drop every conditional at-rule and its body. `--color-border` is re-declared under
 * `prefers-contrast: more`, and a card is rendered for a crawler, which matches no media query —
 * only the unconditional declarations describe what it paints.
 */
function stripConditionalBlocks(css) {
  const at = /@(?:media|supports|container)\b/g
  let out = css
  for (let match = at.exec(out); match; match = at.exec(out)) {
    const open = out.indexOf('{', match.index)
    if (open === -1) break
    let depth = 0
    let close = open
    for (; close < out.length; close++) {
      if (out[close] === '{') depth++
      else if (out[close] === '}' && --depth === 0) break
    }
    out = out.slice(0, match.index) + out.slice(close + 1)
    at.lastIndex = match.index
  }
  return out
}

/** Every unconditional `--name: value` in the sheet; a later declaration wins, as the cascade says. */
function readDeclarations(css) {
  const declarations = new Map()
  for (const [, name, value] of stripConditionalBlocks(css).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    declarations.set(name, value.trim().replace(/\s+/g, ' '))
  }
  return declarations
}

/** Resolve a token to the `oklch(...)` the dark arm paints, through `light-dark()` and `var()`. */
function resolveDark(declarations, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`${name}: circular reference`)
  seen.add(name)
  let value = declarations.get(name)
  if (!value) throw new Error(`${name}: not declared in index.css`)

  const pair = value.match(/^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/)
  if (pair) value = pair[2]

  const reference = value.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i)
  if (reference) return resolveDark(declarations, reference[1], seen)

  const oklch = value.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/i)
  if (!oklch) throw new Error(`${name}: not a plain oklch() colour (${value})`)
  const [, l, c, h] = oklch
  return { l: value.includes('%') ? Number(l) / 100 : Number(l), c: Number(c), h: Number(h) }
}

/** oklch → sRGB hex, clamped to the gamut (the same maths the browser runs). */
function toHex({ l, c, h }) {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ]
  const linear = [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ]
  const channel = (v) => {
    const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.max(0, Math.min(255, Math.round(srgb * 255)))
  }
  return `#${linear.map(channel).map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const [css, theme] = await Promise.all([readFile(cssPath, 'utf8'), readFile(themePath, 'utf8')])
const declarations = readDeclarations(css)

// `name: '#rrggbb', // --token` — the comment is the claim this script checks.
const claims = [...theme.matchAll(/^\s*([a-zA-Z0-9]+):\s*'(#[0-9a-f]{6})',\s*\/\/\s*(--[a-z0-9-]+)/gim)]
if (claims.length === 0) {
  console.error('check-og-palette: found no `name: \'#hex\', // --token` lines in theme.ts')
  process.exit(1)
}

const failures = []
for (const [, key, hex, token] of claims) {
  let expected
  try {
    expected = toHex(resolveDark(declarations, token))
  } catch (err) {
    failures.push(`${key}: ${err.message}`)
    continue
  }
  if (expected !== hex.toLowerCase()) {
    failures.push(`${key}: theme.ts says ${hex}, ${token} resolves to ${expected}`)
  }
}

if (failures.length) {
  console.error(`check-og-palette: ${failures.length} colour(s) drifted from the tokens\n`)
  for (const failure of failures) console.error(`  ${failure}`)
  console.error(`\nUpdate api/src/og/theme.ts (or the token in web/src/index.css).`)
  process.exit(1)
}

console.log(`check-og-palette: ${claims.length} colours match their tokens`)
