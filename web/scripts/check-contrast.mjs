#!/usr/bin/env node
/**
 * APCA contrast floor for the palette, in both theme arms.
 *
 *   node scripts/check-contrast.mjs [indexCss]
 *
 * WCAG 2.x ratios are computed from a luminance formula that badly misreads dark UI: it scores
 * light-on-dark far higher than the eye does, which is how a dim text token could read
 * "4.6:1, fine" while 12px copy on it was measurably hard to read. APCA (the WCAG 3 draft
 * contrast method) models the text polarity and the spatial frequency instead, and reports a
 * signed lightness contrast, Lc, from -108 to 108. |Lc| 60 is APCA's floor for body text at the
 * 14-18px / 400-weight the app actually sets; every pair below is body text or a chip label.
 *
 * This reads the source `@theme` block rather than the built CSS on purpose: these are the
 * authored values, and a token that regresses should fail before it is ever bundled. Colours
 * are resolved out of the stylesheet — oklch, hex, rgb(), `var(--token)`, the
 * `light-dark(<light>, <dark>)` pair every Soft Press token is written as (checked once per arm),
 * and the one `color-mix(in <space>, <colour> N%, transparent)` shape the state vocabulary uses —
 * so editing a token here is the only way to move a number.
 *
 * Fails (exit 1) if any checked pair falls below the floor in either arm. Prints the whole table
 * either way, because the margins are the point: a pair sitting at 61 is a pair one polish pass
 * from failing.
 *
 * The APCA-W3 0.1.9 constants are inlined; the package is not a dependency of this app and this
 * guard is not worth one.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"

/** |Lc| a text pair has to clear. APCA's own bronze floor for 14-18px body copy. */
const FLOOR = 60

/** The two arms of every `light-dark()` token. */
const ARMS = ["light", "dark"]

// ── colour ────────────────────────────────────────────────────────────────────────────────────

const srgbEncode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp01 = (c) => Math.min(1, Math.max(0, c))

/** oklch -> sRGB, via OKLab's LMS cube roots and the linear-sRGB matrix (Ottosson). */
function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => clamp01(srgbEncode(c)))
}

const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i
const HEX = /^#([0-9a-f]{3,8})$/i
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i

const ratio = (n) => (n.endsWith("%") ? parseFloat(n) / 100 : parseFloat(n))

/** A literal -> `{ rgb: [r, g, b], alpha }`, all channels 0-1. */
function parseColor(literal) {
  const lit = literal.trim()
  let m
  if ((m = lit.match(OKLCH))) {
    return { rgb: oklchToRgb(ratio(m[1]), +m[2], +m[3]), alpha: m[4] === undefined ? 1 : ratio(m[4]) }
  }
  if ((m = lit.match(HEX))) {
    const hex = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join("") : m[1]
    const at = (i) => parseInt(hex.slice(i, i + 2), 16) / 255
    return { rgb: [at(0), at(2), at(4)], alpha: hex.length === 8 ? at(6) : 1 }
  }
  if ((m = lit.match(RGB))) {
    return { rgb: [+m[1] / 255, +m[2] / 255, +m[3] / 255], alpha: m[4] === undefined ? 1 : ratio(m[4]) }
  }
  throw new Error(`cannot read the colour ${literal}`)
}

/** Source-over compositing of a translucent colour onto an opaque ground. */
const over = ({ rgb, alpha }, ground) => rgb.map((c, i) => c * alpha + ground[i] * (1 - alpha))

// ── APCA-W3 0.1.9 ─────────────────────────────────────────────────────────────────────────────

const [Rco, Gco, Bco] = [0.2126729, 0.7151522, 0.072175]
const [normBG, normTXT, revTXT, revBG] = [0.56, 0.57, 0.62, 0.65]
const [blkThrs, blkClmp] = [0.022, 1.414]
const [scale, loOffset, loClip, deltaYmin] = [1.14, 0.027, 0.1, 0.0005]

const screenY = ([r, g, b]) => Rco * r ** 2.4 + Gco * g ** 2.4 + Bco * b ** 2.4
const softClamp = (y) => (y < blkThrs ? y + (blkThrs - y) ** blkClmp : y)

/** Signed lightness contrast of text on a background, -108..108. Negative = light text on dark background. */
function apcaLc(text, background) {
  const Yt = softClamp(screenY(text))
  const Yb = softClamp(screenY(background))
  if (Math.abs(Yb - Yt) < deltaYmin) return 0
  if (Yb > Yt) {
    const S = (Yb ** normBG - Yt ** normTXT) * scale
    return (S < loClip ? 0 : S - loOffset) * 100
  }
  const S = (Yb ** revBG - Yt ** revTXT) * scale
  return (S > -loClip ? 0 : S + loOffset) * 100
}

// ── the stylesheet ────────────────────────────────────────────────────────────────────────────

/** The stylesheet without its comments, so a token name quoted in prose cannot pass for a block. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

/** Body of the first `<opener> { … }` block, brace-counted so nested rules do not truncate it. */
function block(css, opener) {
  const start = css.indexOf(opener)
  if (start < 0) throw new Error(`${opener} is not in the stylesheet`)
  let depth = 0
  for (let i = css.indexOf("{", start); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1
    else if (css[i] === "}" && (depth -= 1) === 0) return css.slice(css.indexOf("{", start) + 1, i)
  }
  throw new Error(`${opener} is never closed`)
}

/** Every `--name: value;` a block declares directly. */
function customProperties(body) {
  const out = {}
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    out[m[1]] = m[2].replace(/\s+/g, " ").trim()
  }
  return out
}

/** The arguments of a function call, split on the commas at its own nesting level. */
function args(value, fn) {
  const inner = value.slice(fn.length + 1, -1)
  const parts = []
  let depth = 0
  let current = ""
  for (const ch of inner) {
    if (ch === "(") depth += 1
    else if (ch === ")") depth -= 1
    if (ch === "," && depth === 0) {
      parts.push(current)
      current = ""
    } else current += ch
  }
  parts.push(current)
  return parts.map((part) => part.trim())
}

const MIX = /^color-mix\(\s*in\s+[\w-]+\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i

/**
 * A token's value as a colour in one arm. `var()` chases through the same table; `light-dark()`
 * takes the arm's branch; `color-mix(… , transparent)` is premultiplied interpolation against
 * `rgb(0 0 0 / 0)`, which is the colour itself at the mixed alpha — the only mix shape
 * `--state-*` uses.
 */
function resolveColor(value, tokens, arm, seen = new Set()) {
  const v = value.trim()
  const varName = v.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (varName) {
    if (seen.has(varName[1])) throw new Error(`${varName[1]} resolves to itself`)
    if (!(varName[1] in tokens)) throw new Error(`${varName[1]} is not declared`)
    return resolveColor(tokens[varName[1]], tokens, arm, new Set(seen).add(varName[1]))
  }
  if (/^light-dark\(/i.test(v) && v.endsWith(")")) {
    const pair = args(v, "light-dark")
    if (pair.length !== 2) throw new Error(`${v} does not carry exactly a light and a dark arm`)
    return resolveColor(pair[arm === "light" ? 0 : 1], tokens, arm, seen)
  }
  const mix = v.match(MIX)
  if (mix) {
    const base = resolveColor(mix[1], tokens, arm, seen)
    return { rgb: base.rgb, alpha: base.alpha * (parseFloat(mix[2]) / 100) }
  }
  return parseColor(v)
}

// ── the pairs ─────────────────────────────────────────────────────────────────────────────────

const CSS_PATH = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "src", "index.css"))

const css = stripComments(readFileSync(CSS_PATH, "utf8"))
const tokens = { ...customProperties(block(css, "@theme static")), ...customProperties(block(css, ":root")) }

/**
 * Every pair is real, and a pair leaves this list the moment no markup paints it: an audited pair
 * that nothing renders pins a token the palette would otherwise be free to drop. Ink and muted ink
 * are body copy on each of the five surfaces; the on-action pairs are the primary and secondary
 * button labels; each status text sits on its status surface (the Notice, the field error); link is
 * the anchor colour on the page and in a card; each tier's chip label sits on its chip (Prismatic's
 * on the gradient's first stop, the flat fallback). A background is a token name, or
 * `{ tint, over }`: a translucent state tint composited on the lightest surface it can land on.
 *
 * Dropped in wave 5 because nothing painted them any more: `--color-text-inverse` on
 * `--color-danger-fill` (the alerts badge is `bg-error-text text-canvas`, the confirm dialog is
 * `<Button variant="danger">`) and the `--state-error-bg` / `--state-success-bg` washes (no call
 * site in `src/`). The wave-5 cleanup pass removed all four properties from `index.css`.
 */
const SURFACES = ["--color-canvas", "--color-canvas-alt", "--color-surface", "--color-surface-raised", "--color-surface-pressed"]
const TIERS = ["paper", "silver", "holo", "chrome", "gold", "prismatic", "shiny"]
const PAIRS = [
  ...SURFACES.map((surface) => ["--color-ink", surface]),
  ...SURFACES.map((surface) => ["--color-ink-muted", surface]),
  ["--color-on-action", "--color-action"],
  ["--color-on-action-secondary", "--color-action-secondary"],
  ["--color-success-text", "--color-success-surface"],
  ["--color-warning-text", "--color-warning-surface"],
  ["--color-error-text", "--color-error-surface"],
  ["--color-info-text", "--color-info-surface"],
  ["--color-link", "--color-canvas"],
  ["--color-link", "--color-surface"],
  ...TIERS.map((tier) => [`--color-tier-${tier}-chip-text`, `--color-tier-${tier}-chip`]),
]

/**
 * Tokens that are not text colours, and the guard that keeps them from becoming one.
 *
 * `--color-focus` is the ring: it is chosen to sit *against* a surface at 3px, not to be read on
 * one, and its dark arm measures Lc -53 on `--color-surface` — under the floor above. Twice now a
 * screen has picked it up as an accent for bare text (Friends' quiet exits, Trade's swap glyph)
 * because the board draws that accent in the same hue; both now use `--color-link`, which is the
 * same idea inside the floor. Auditing the pair would only fail the gate, so the guard is a scan:
 * no source file may paint text in it.
 */
const NOT_TEXT = [
  { token: "--color-focus", instead: "--color-link", patterns: [/\btext-focus\b/, /(^|[;{\s])color:\s*var\(--color-focus\)/] },
]

/** Repo-relative where that reads, absolute where it would be a stack of `..`. */
const short = relative(process.cwd(), CSS_PATH)
const display = short && !short.startsWith("..") && !isAbsolute(short) ? short : CSS_PATH

const rows = PAIRS.flatMap(([fg, bg]) =>
  ARMS.map((arm) => {
    const color = (name) => resolveColor(`var(${name})`, tokens, arm)
    const text = color(fg).rgb
    const background = typeof bg === "string" ? color(bg).rgb : over(color(bg.tint), color(bg.over).rgb)
    const label = typeof bg === "string" ? bg : `${bg.tint} over ${bg.over.replace("--color-", "")}`
    const lc = apcaLc(text, background)
    return { fg, bg: label, arm, lc, pass: Math.abs(lc) >= FLOOR }
  }),
)
const failed = rows.filter((row) => !row.pass)

/** Every source file the app paints from, so a `text-<token>` utility cannot hide in one. */
const SRC = resolve(join(import.meta.dirname, "..", "src"))
const sources = existsSync(SRC)
  ? readdirSync(SRC, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(tsx?|css)$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name))
      .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
  : []
const painted = NOT_TEXT.flatMap(({ token, instead, patterns }) =>
  sources.flatMap((file) => {
    const text = readFileSync(file, "utf8")
    return text.split("\n").flatMap((line, index) =>
      patterns.some((pattern) => pattern.test(line)) && !line.trimStart().startsWith("*")
        ? [{ token, instead, where: `${relative(process.cwd(), file)}:${index + 1}` }]
        : [],
    )
  }),
)

const width = (pick) => Math.max(...rows.map((row) => pick(row).length))
const fgWidth = width((row) => row.fg)
const bgWidth = width((row) => row.bg)
for (const row of rows) {
  const lc = row.lc.toFixed(1).padStart(6)
  console.log(
    `  ${row.fg.padEnd(fgWidth)}  on  ${row.bg.padEnd(bgWidth)}  ${row.arm.padEnd(5)}  Lc ${lc}  ${row.pass ? "ok" : "BELOW " + FLOOR}`,
  )
}

if (painted.length) {
  console.error(
    `\ncheck-contrast: ${painted.length} place(s) paint text in a token that is not a text colour:\n` +
      painted.map((hit) => `  ${hit.where} uses ${hit.token} — use ${hit.instead}`).join("\n"),
  )
  process.exit(1)
}

if (failed.length) {
  console.error(
    `\ncheck-contrast: ${failed.length} of ${rows.length} pair(s) in ${display} read below APCA Lc ${FLOOR}:\n` +
      failed.map((row) => `  ${row.fg} on ${row.bg} (${row.arm}) is Lc ${row.lc.toFixed(1)}`).join("\n") +
      `\n\nMove the failing arm of the foreground token — its lightness away from the surface's (chroma\n` +
      `may have to come down to stay in sRGB) — rather than the surface, which every other pair also\n` +
      `stands on. A pair that fails in one arm only needs that arm of its light-dark() touched.`,
  )
  process.exit(1)
}

console.log(`check-contrast: ${rows.length} pair(s) across ${ARMS.join(" and ")}, all >= APCA Lc ${FLOOR} (${display})`)
console.log(`check-contrast: ${sources.length} source file(s) scanned, none paint text in ${NOT_TEXT.map((entry) => entry.token).join(", ")}`)
