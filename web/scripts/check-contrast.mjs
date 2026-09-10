#!/usr/bin/env node
/**
 * APCA contrast floor for the palette.
 *
 *   node scripts/check-contrast.mjs [indexCss]
 *
 * WCAG 2.x ratios are computed from a luminance formula that badly misreads dark UI: it scores
 * light-on-dark far higher than the eye does, which is how `--color-text-dim` at L 0.705 could
 * read "4.6:1, fine" while 12px copy on it was measurably hard to read. APCA (the WCAG 3 draft
 * contrast method) models the text polarity and the spatial frequency instead, and reports a
 * signed lightness contrast, Lc, from -108 to 108. |Lc| 60 is APCA's floor for body text at the
 * 14-18px / 400-weight the app actually sets; every pair below is body text or a badge label.
 *
 * This reads the source `@theme` block rather than the built CSS on purpose: these are the
 * authored values, and a token that regresses should fail before it is ever bundled. Colours
 * are resolved out of the stylesheet — oklch, hex, rgb(), `var(--token)` and the one
 * `color-mix(in <space>, var(--token) N%, transparent)` shape the state vocabulary uses — so
 * editing a token here is the only way to move a number.
 *
 * Fails (exit 1) if any checked pair falls below the floor. Prints the whole table either way,
 * because the margins are the point: a pair sitting at 61 is a pair one polish pass from
 * failing.
 *
 * The APCA-W3 0.1.9 constants are inlined; the package is not a dependency of this app and this
 * guard is not worth one.
 */
import { readFileSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"

/** |Lc| a text pair has to clear. APCA's own bronze floor for 14-18px body copy. */
const FLOOR = 60

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

/** Signed lightness contrast of text on a background, -108..108. Negative = dark text on light. */
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

/** Every `--name: value;` a block declares directly, comments stripped. */
function customProperties(body) {
  const out = {}
  for (const m of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim()
  }
  return out
}

const MIX = /^color-mix\(\s*in\s+[\w-]+\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i

/**
 * A token's value as a colour. `var()` chases through the same table; `color-mix(… , transparent)`
 * is premultiplied interpolation against `rgb(0 0 0 / 0)`, which is the colour itself at the mixed
 * alpha — the only mix shape `--state-*` uses.
 */
function resolveColor(value, tokens, seen = new Set()) {
  const v = value.trim()
  const varName = v.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  if (varName) {
    if (seen.has(varName[1])) throw new Error(`${varName[1]} resolves to itself`)
    if (!(varName[1] in tokens)) throw new Error(`${varName[1]} is not declared`)
    return resolveColor(tokens[varName[1]], tokens, new Set(seen).add(varName[1]))
  }
  const mix = v.match(MIX)
  if (mix) {
    const base = resolveColor(mix[1], tokens, seen)
    return { rgb: base.rgb, alpha: base.alpha * (parseFloat(mix[2]) / 100) }
  }
  return parseColor(v)
}

// ── the pairs ─────────────────────────────────────────────────────────────────────────────────

const CSS_PATH = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "src", "index.css"))

const css = readFileSync(CSS_PATH, "utf8")
const tokens = { ...customProperties(block(css, "@theme static")), ...customProperties(block(css, ":root")) }
const color = (value) => resolveColor(value, tokens)
const ground = (name) => color(`var(${name})`).rgb
/** A translucent state tint painted over the lightest surface it can land on: the worst case. */
const tintOn = (tint, surface) => over(color(`var(${tint})`), ground(surface))

/**
 * Every pair is real: dim copy is `--color-text-dim` on all three surfaces, danger copy is the
 * field error / questbar error / person-row destructive label on the same three, and the two
 * white-on-fill pairs are the alerts bell badge and the confirm dialog's danger button, which
 * both wear `bg-danger-fill text-text-inverse`.
 */
const PAIRS = [
  ["--color-text", "--color-bg", ground("--color-text"), ground("--color-bg")],
  ["--color-text-dim", "--color-bg", ground("--color-text-dim"), ground("--color-bg")],
  ["--color-text-dim", "--color-bg-raised", ground("--color-text-dim"), ground("--color-bg-raised")],
  ["--color-text-dim", "--color-bg-card", ground("--color-text-dim"), ground("--color-bg-card")],
  ["--color-accent", "--color-bg", ground("--color-accent"), ground("--color-bg")],
  ["--color-danger", "--color-bg", ground("--color-danger"), ground("--color-bg")],
  ["--color-danger", "--color-bg-raised", ground("--color-danger"), ground("--color-bg-raised")],
  ["--color-danger", "--color-bg-card", ground("--color-danger"), ground("--color-bg-card")],
  [
    "--color-danger",
    "--state-error-bg on card",
    ground("--color-danger"),
    tintOn("--state-error-bg", "--color-bg-card"),
  ],
  ["--color-ok", "--state-success-bg on card", ground("--color-ok"), tintOn("--state-success-bg", "--color-bg-card")],
  ["--color-text-inverse", "--color-danger-fill", ground("--color-text-inverse"), ground("--color-danger-fill")],
]

/** Repo-relative where that reads, absolute where it would be a stack of `..`. */
const short = relative(process.cwd(), CSS_PATH)
const display = short && !short.startsWith("..") && !isAbsolute(short) ? short : CSS_PATH

const rows = PAIRS.map(([fg, bg, text, background]) => {
  const lc = apcaLc(text, background)
  return { fg, bg, lc, pass: Math.abs(lc) >= FLOOR }
})
const failed = rows.filter((row) => !row.pass)

const width = (pick) => Math.max(...rows.map((row) => pick(row).length))
const fgWidth = width((row) => row.fg)
const bgWidth = width((row) => row.bg)
for (const row of rows) {
  const lc = row.lc.toFixed(1).padStart(6)
  console.log(
    `  ${row.fg.padEnd(fgWidth)}  on  ${row.bg.padEnd(bgWidth)}  Lc ${lc}  ${row.pass ? "ok" : "BELOW " + FLOOR}`,
  )
}

if (failed.length) {
  console.error(
    `\ncheck-contrast: ${failed.length} of ${rows.length} pair(s) in ${display} read below APCA Lc ${FLOOR}:\n` +
      failed.map((row) => `  ${row.fg} on ${row.bg} is Lc ${row.lc.toFixed(1)}`).join("\n") +
      `\n\nRaise the lightness of the foreground token (chroma may have to come down to stay in sRGB)\n` +
      `rather than darkening the surface, which every other pair also stands on.`,
  )
  process.exit(1)
}

console.log(`check-contrast: ${rows.length} pair(s), all >= APCA Lc ${FLOOR} (${display})`)
