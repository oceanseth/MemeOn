#!/usr/bin/env node
/**
 * Cascade-layer order guard for the built CSS.
 *
 *   node scripts/check-layers.mjs [distDir]
 *
 * A cascade layer's rank is fixed where its name FIRST appears in a stylesheet — a statement
 * (`@layer a, b, c;`) and a block (`@layer a { … }`) both count. So a bare `@layer components
 * { … }` emitted ahead of the order statement silently makes `components` the *lowest* layer
 * in the bundle, below `legacy` and below preflight. Nothing errors and no selector changes;
 * every migrated component just quietly loses to the sheet it was supposed to replace.
 *
 * This reads the shipped CSS rather than the source, because that emission order is decided by
 * the module graph (`main.tsx`'s import order, Vite's chunking) and not by any one stylesheet —
 * and because Tailwind and lightningcss rewrite the order statement on the way out: with
 * `index.css` first, `@layer theme, base, legacy, components, utilities;` is emitted as
 * Tailwind's own `@layer properties { … }` block followed by its `theme`/`base` blocks, the
 * legacy block, a bare `@layer components;` and the `utilities` block. That is the same order,
 * spelled with blocks, so the check is on the order the file *establishes*, not on its syntax.
 *
 * Fails (exit 1) on any `<dist>/assets/*.css` whose first mention of each layer does not rank
 * theme, base, legacy, components, utilities in that relative order, or that ranks Tailwind's
 * `properties` layer at or above `theme` (above `utilities` its `initial`s would beat the
 * utilities that set them).
 *
 * A stylesheet with no `@layer` at all is unlayered and pins nothing, so it passes.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"

/** Repo-relative where that reads, absolute where it would be a stack of `..`. */
const display = (path) => {
  const short = relative(process.cwd(), path)
  return short && !short.startsWith("..") && !isAbsolute(short) ? short : path
}

// The relative order every stylesheet has to agree on. Other names may sit between them.
const REQUIRED = ["theme", "base", "legacy", "components", "utilities"]
// The layers the migration writes into: the ones a stray early block would demote.
const MIGRATED = ["components", "utilities"]

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const dist = resolve(positional[0] ?? "dist")
const assets = join(dist, "assets")

if (!existsSync(assets)) {
  console.error(`check-layers: ${assets} does not exist — run the build first`)
  process.exit(2)
}

/**
 * Every `@layer` at-rule in source order, as `{ kind, names, index }`. Comments and quoted
 * strings are skipped, so a `content: "@layer components {"` declaration cannot fake a token.
 */
const tokenizeLayers = (css) => {
  const tokens = []
  let i = 0
  while (i < css.length) {
    const char = css[i]
    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      i = end === -1 ? css.length : end + 2
      continue
    }
    if (char === '"' || char === "'") {
      const quote = char
      i += 1
      while (i < css.length && css[i] !== quote) i += css[i] === "\\" ? 2 : 1
      i += 1
      continue
    }
    // `@layer` has to end at whitespace, `{` (an anonymous layer) or `;`; anything else is a
    // longer at-rule name such as `@layered`.
    if (char === "@" && css.startsWith("@layer", i) && /^[\s{;]?$/.test(css[i + 6] ?? "")) {
      let j = i + 6
      while (j < css.length && css[j] !== "{" && css[j] !== ";") j += 1
      const names = css
        .slice(i + 6, j)
        .split(",")
        // `@layer a.b` ranks under its top-level `a`, which is the only rank this contract names.
        .map((name) => name.trim().split(".")[0])
        .filter(Boolean)
      tokens.push({ kind: css[j] === "{" ? "block" : "statement", names, index: i })
      i = j + 1
      continue
    }
    i += 1
  }
  return tokens
}

/** The layer names in the order the stylesheet ranks them: each one at its first mention. */
const layerOrder = (tokens) => {
  const order = []
  for (const token of tokens) {
    for (const name of token.names) {
      if (!order.includes(name)) order.push(name)
    }
  }
  return order
}

/** `names` appear inside `order` in that relative order. */
const isSubsequence = (names, order) => {
  let at = 0
  for (const name of order) {
    if (name === names[at]) at += 1
  }
  return at === names.length
}

/** Every reason `css` breaks the contract. Empty means it holds. */
const checkLayerOrder = (css) => {
  const tokens = tokenizeLayers(css)
  if (tokens.length === 0) return []

  const problems = []
  const order = layerOrder(tokens)
  const ranked = `ranks its layers ${order.join(" < ") || "<none>"}`

  if (!isSubsequence(REQUIRED, order)) {
    problems.push(`${ranked} — it has to rank ${REQUIRED.join(" < ")}, each one above the last`)
    // The regression this guard exists for: a co-located component sheet reaching the bundle
    // before the order statement, which demotes its own layer to the bottom.
    const first = tokens[0]
    if (first.kind === "block" && first.names.some((name) => MIGRATED.includes(name))) {
      problems.push(
        `opens with a bare @layer ${first.names.join(", ")} { … } block, so ${first.names.join(", ")} is pinned as the lowest layer here — the order statement has to reach this stylesheet first`,
      )
    }
  }

  const properties = order.indexOf("properties")
  const theme = order.indexOf("theme")
  if (properties !== -1 && theme !== -1 && properties > theme) {
    problems.push(
      `${ranked} — Tailwind's @property fallbacks live in "properties" and have to rank below "theme", or their initials beat the utilities that set them`,
    )
  }
  return problems
}

const stylesheets = readdirSync(assets)
  .filter((name) => name.endsWith(".css"))
  .sort()

if (stylesheets.length === 0) {
  console.error(`check-layers: no stylesheets in ${assets} — the build emitted no CSS`)
  process.exit(2)
}

let failed = 0
let layered = 0
for (const name of stylesheets) {
  const file = join(assets, name)
  const css = readFileSync(file, "utf8")
  if (tokenizeLayers(css).length > 0) layered += 1
  for (const problem of checkLayerOrder(css)) {
    console.error(`${display(file)}: ${problem}`)
    failed += 1
  }
}

if (failed > 0) {
  console.error(`check-layers: ${failed} cascade-layer problem(s) under ${display(dist)}`)
  process.exit(1)
}

console.log(
  `check-layers: ${stylesheets.length} stylesheet(s), ${layered} layered, each ranks ${REQUIRED.join(" < ")} (${display(dist)})`,
)
