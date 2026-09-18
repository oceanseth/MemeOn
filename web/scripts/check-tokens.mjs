#!/usr/bin/env node
/**
 * Dead-token and cn-drift guard for `src/index.css`'s `@theme`.
 *
 *   node scripts/check-tokens.mjs [indexCss] [srcDir]
 *
 * Two failures, both of them "the sheet says something the app does not":
 *
 * 1. **A dead token.** Every `--<namespace>-<name>` declared in `@theme static` has to be
 *    reachable from the app: as a `var(--…)` anywhere in the source, or as a utility built from
 *    it (`bg-primary`, `max-w-card-narrow`, `text-2xl`, `rounded-lg`, `font-display`,
 *    `max-md:`/`md:` for a breakpoint, `animate-<name>`). A token nothing reaches is a name the
 *    palette still has to keep honest for no one.
 *
 * 2. **cn drift.** `lib/cn.ts` registers the `@theme` namespaces whose values tailwind-merge
 *    cannot validate on its own. Registering a namespace that no longer exists, or leaving one
 *    out that does, is how two conflicting classes both survive a merge — so the two lists have
 *    to agree, and the reason a namespace is absent is written in cn.ts rather than here.
 *
 * The parser is deliberately small: it reads the authored `@theme static { … }` block, not the
 * built stylesheet, for the same reason check-contrast does — a regression should fail before it
 * is ever bundled.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"

const CSS_PATH = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "src", "index.css"))
const SRC = resolve(process.argv[3] ?? join(import.meta.dirname, "..", "src"))

if (!existsSync(CSS_PATH)) {
  console.error(`check-tokens: ${CSS_PATH} does not exist`)
  process.exit(2)
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

/** The body of the first `<at-rule> {` … matching `}`. */
function block(css, opener) {
  const start = css.indexOf(opener)
  if (start === -1) return ""
  let depth = 0
  for (let i = css.indexOf("{", start); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1
    else if (css[i] === "}") {
      depth -= 1
      if (depth === 0) return css.slice(css.indexOf("{", start) + 1, i)
    }
  }
  return ""
}

const css = stripComments(readFileSync(CSS_PATH, "utf8"))
const theme = block(css, "@theme static")

/** `--color-primary: …` → `--color-primary`, skipping the `--ns-*: initial` resets. */
const declared = [...theme.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
  .filter(([, , value]) => value.trim() !== "initial")
  .map(([, name]) => name)

/** The namespaces `@theme` actually holds, in declaration order. */
const NAMESPACES = ["color", "radius", "text", "font", "font-weight", "spacing", "container", "breakpoint", "animate", "tracking", "leading", "shadow", "ease"]
const split = (token) => {
  const bare = token.slice(2)
  const namespace = NAMESPACES.filter((ns) => bare === ns || bare.startsWith(`${ns}-`)).sort((a, b) => b.length - a.length)[0]
  return namespace ? { namespace, name: bare.slice(namespace.length + 1) } : null
}

const sources = readdirSync(SRC, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(tsx?|css|mdx|html)$/.test(entry.name))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
const HTML = resolve(join(import.meta.dirname, "..", "index.html"))
if (existsSync(HTML)) sources.push(HTML)
const haystack = sources.map((file) => readFileSync(file, "utf8")).join("\n")

/**
 * The utilities Tailwind builds from each namespace. A token is reached when the source holds
 * `var(--token)`, or any of its namespace's utilities carrying its name — under any variant
 * (`max-md:bg-error`), sign (`-mt-4`), modifier (`bg-primary/50`) or `!`.
 */
const UTILITIES = {
  color: ["bg", "text", "border", "border-t", "border-b", "border-l", "border-r", "border-x", "border-y",
    "ring", "inset-ring", "outline", "fill", "stroke", "from", "via", "to", "decoration", "accent",
    "caret", "shadow", "divide", "placeholder", "bg-linear-to-r"],
  radius: ["rounded", "rounded-t", "rounded-b", "rounded-l", "rounded-r", "rounded-s", "rounded-e",
    "rounded-tl", "rounded-tr", "rounded-bl", "rounded-br"],
  text: ["text"],
  font: ["font"],
  "font-weight": ["font"],
  tracking: ["tracking"],
  leading: ["leading"],
  animate: ["animate"],
  shadow: ["shadow", "inset-shadow", "drop-shadow"],
  ease: ["ease"],
  spacing: ["p", "px", "py", "pt", "pb", "pl", "pr", "m", "mx", "my", "mt", "mb", "ml", "mr",
    "gap", "gap-x", "gap-y", "w", "h", "size", "min-w", "min-h", "max-w", "max-h", "inset", "top",
    "bottom", "left", "right", "space-x", "space-y", "translate-x", "translate-y", "basis"],
  container: ["max-w", "min-w", "w"],
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** The source with every custom-property *declaration* name blanked, so a token cannot reach itself. */
const classes = haystack.replace(/--[\w-]+(?=\s*:)/g, " ")

const reaches = (token) => {
  if (haystack.includes(`var(${token})`)) return true
  const parts = split(token)
  if (!parts) return classes.includes(token)
  const { namespace, name } = parts
  // a per-step modifier (`--text-2xl--line-height`) rides on the step it belongs to
  if (name.includes("--")) return true
  if (namespace === "breakpoint") return new RegExp(`(?<![\\w-])(max-)?${escape(name)}:`).test(classes)
  if (namespace === "container" && new RegExp(`@(max-)?${escape(name)}:`).test(classes)) return true
  const prefixes = UTILITIES[namespace]
  if (!prefixes) return classes.includes(`${namespace}-${name}`)
  const probe = new RegExp(`(?<![\\w-])(${prefixes.map(escape).join("|")})-${escape(name)}(?![\\w-])`)
  return probe.test(classes)
}

const dead = declared.filter((token) => !reaches(token))

/** The namespaces `lib/cn.ts` registers under `extend.theme`. */
const cnPath = join(SRC, "lib", "cn.ts")
const cn = existsSync(cnPath) ? readFileSync(cnPath, "utf8") : ""
const registered = Object.fromEntries(
  [...block(cn, "theme:").matchAll(/(\w[\w-]*)\s*:\s*\[([^\]]*)\]/g)].map(([, ns, names]) => [
    ns,
    [...names.matchAll(/'([^']+)'/g)].map(([, name]) => name).sort(),
  ]),
)
const inTheme = {}
for (const token of declared) {
  const parts = split(token)
  if (!parts) continue
  ;(inTheme[parts.namespace] ??= []).push(parts.name)
}
const drift = Object.entries(registered).flatMap(([namespace, names]) => {
  const actual = [...new Set(inTheme[namespace] ?? [])].sort()
  const missing = names.filter((name) => !actual.includes(name))
  return missing.length ? [`  cn.ts registers ${namespace}: ${missing.join(", ")} — not in @theme`] : []
})

const short = relative(process.cwd(), CSS_PATH)
const display = short && !short.startsWith("..") && !isAbsolute(short) ? short : CSS_PATH

if (dead.length) {
  console.error(
    `check-tokens: ${dead.length} token(s) in ${display} are declared and never reached:\n` +
      dead.map((token) => `  ${token}`).join("\n") +
      `\n  delete the declaration, or paint it.`,
  )
}
if (drift.length) {
  console.error(`check-tokens: lib/cn.ts and @theme disagree:\n${drift.join("\n")}`)
}
if (dead.length || drift.length) process.exit(1)

console.log(
  `check-tokens: ${declared.length} token(s) in ${display} all reached; ` +
    `lib/cn.ts registers ${Object.keys(registered).join(", ") || "nothing"} and @theme agrees`,
)
