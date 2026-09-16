#!/usr/bin/env node
/**
 * Documentation guard: every backticked name in a repo document has to exist.
 *
 *   node scripts/check-docs.mjs [repoRoot]
 *
 * The documents are pointers, so the only way they rot is by naming something the tree no longer
 * has. Five failures, each read straight back out of the code:
 *
 * 1. **A dead path.** A backticked or linked repo path (`web/src/atoms/button.tsx`,
 *    [docs/x.md](docs/x.md)) that is not on disk.
 * 2. **An undeclared token or class.** `--color-brand` has to be declared in a stylesheet, and a
 *    `bg-<name>` / `text-<name>` / `rounded-<name>` class has to name a token `@theme` declares or
 *    a utility `index.css` emits.
 * 3. **A component that is nowhere.** `atoms/Button` has to be exported by a file in
 *    `src/atoms|molecules|organisms`, and in the three documents that describe the tree
 *    (README.md, DESIGN.md, Anatomy.mdx) a bare `` `Name` `` has to be declared or imported
 *    somewhere in `web/src`, `web/.storybook`, `shared`, `api/src` or `mobile/src`.
 * 4. **A script that does not exist.** `pnpm --filter web run check-tokens` has to be a script in
 *    that workspace's package.json.
 * 5. **The wrong package manager.** This is a pnpm workspace (`packageManager` in the root
 *    package.json); `npm run …` / `npx …` in a document is an instruction that does not work here.
 *
 * A case-only difference (`Button.tsx` beside `button.tsx`) is invisible to `existsSync` on APFS,
 * so rule 1 catches a PascalCase file name on CI's Linux runner but not on a laptop.
 *
 * Documents that are git-excluded on one checkout and absent from another (DESIGN.md, docs/*) are
 * skipped when missing rather than failing, so the same command passes in a fresh clone and on a
 * local checkout that has them. `scripts/docs-allowlist.json` holds the deliberate exceptions —
 * an archive quoting a 2026-09-08 prompt, a specification for something unbuilt — and every entry
 * carries the document it is scoped to and the reason it is there.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"

const ROOT = resolve(process.argv[2] ?? join(import.meta.dirname, "..", ".."))
const WEB = join(ROOT, "web")

/** Every document that describes this repo. Missing ones are skipped (see the header). */
const DOCUMENTS = [
  "README.md",
  "AGENTS.md",
  "AGENT_INSTRUCTIONS.md",
  "CLAUDE.md",
  "DESIGN.md",
  "PRODUCT.md",
  "docs/*.md",
  "web/src/Anatomy.mdx",
  "web/public/skill.md",
  "mobile/README.md",
  "mobile/AGENTS.md",
  "mobile/CLAUDE.md",
  "discord/README.md",
]

const expand = (pattern) => {
  if (!pattern.includes("*")) return existsSync(join(ROOT, pattern)) ? [pattern] : []
  const [dir, glob] = [pattern.slice(0, pattern.lastIndexOf("/")), pattern.slice(pattern.lastIndexOf("/") + 1)]
  if (!existsSync(join(ROOT, dir))) return []
  const probe = new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`)
  return readdirSync(join(ROOT, dir))
    .filter((name) => probe.test(name))
    .sort()
    .map((name) => `${dir}/${name}`)
}

// ── What the code actually holds ───────────────────────────────────────────────────────────────

const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "")
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

const SKIP = new Set(["node_modules", ".git", "dist", "storybook-static", ".turbo", "coverage"])
const walk = (dir, test, found = []) => {
  if (!existsSync(dir)) return found
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    if (entry.isDirectory()) walk(join(dir, entry.name), test, found)
    else if (entry.isFile() && test(entry.name)) found.push(join(dir, entry.name))
  }
  return found
}

const stylesheets = walk(join(WEB, "src"), (name) => name.endsWith(".css"))
const css = stripComments(stylesheets.map(read).join("\n"))

/** Every custom property the app declares, `@theme` and `:root` alike. */
const properties = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name))
/** The `@utility` names `index.css` emits (`material-card`, `focus-ring`, `pb-safe-*`). */
const utilities = new Set([...css.matchAll(/@utility\s+([\w-]+)(-\*)?/g)].map(([, name]) => name))

/** `export const X` / `export function X` / `export type X` / `export { X, Y }` / `export default function X`. */
const exportsOf = (file) => {
  const source = read(file)
  const names = [...source.matchAll(/^export\s+(?:default\s+)?(?:const|let|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm)].map(
    ([, name]) => name,
  )
  for (const [, list] of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of list.split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.push(name)
    }
  }
  return names
}

const isSource = (name) => /\.tsx?$/.test(name) && !/\.(stories|test)\.tsx?$/.test(name)
const tierFiles = ["atoms", "molecules", "organisms"].flatMap((tier) => walk(join(WEB, "src", tier), isSource))
const tierExports = new Set(tierFiles.flatMap(exportsOf))

/**
 * Every name the code *has*: declared or imported anywhere under `web/src`, `web/.storybook`,
 * `shared`, `api/src` or `mobile/src`. A document may name a component the app imports
 * (`MemoryRouter`) or one it declares without exporting (`Root`); what it may not do is name one
 * that is nowhere at all.
 */
const identifiers = new Set()
for (const dir of ["web/src", "web/.storybook", "shared", "api/src", "mobile/src"]) {
  for (const file of walk(join(ROOT, dir), (name) => /\.tsx?$/.test(name))) {
    const source = read(file)
    for (const [, name] of source.matchAll(/\b(?:const|let|var|function|class|interface|enum|type)\s+([A-Za-z_$][\w$]*)/g)) identifiers.add(name)
    for (const [, clause] of source.matchAll(/^import\s+(?:type\s+)?([^;]+?)\s+from/gm))
      for (const [name] of clause.matchAll(/[A-Za-z_$][\w$]*/g)) identifiers.add(name)
  }
}

/** Workspace name → its package.json scripts. */
const WORKSPACES = { ".": ".", web: "web", "memeon-api": "api", api: "api", mobile: "mobile", shared: "shared" }
const scriptsOf = {}
for (const [name, dir] of Object.entries(WORKSPACES)) {
  const manifest = read(join(ROOT, dir, "package.json"))
  scriptsOf[name] = manifest ? new Set(Object.keys(JSON.parse(manifest).scripts ?? {})) : new Set()
}

// ── The rules ──────────────────────────────────────────────────────────────────────────────────

/**
 * `{ allow: [{ name, file?, why }] }`. `file` scopes an entry to one document, so a name kept for
 * history in an archive cannot pass unnoticed in a live one. `why` is mandatory prose-for-humans.
 */
const allowlistPath = join(WEB, "scripts", "docs-allowlist.json")
const allowed = read(allowlistPath) ? JSON.parse(read(allowlistPath)).allow : []
for (const entry of allowed) {
  if (!entry.name || !entry.why) {
    console.error(`check-docs: every docs-allowlist.json entry needs a \`name\` and a \`why\`: ${JSON.stringify(entry)}`)
    process.exit(2)
  }
}
const allows = (file, name) => allowed.some((entry) => entry.name === name && (!entry.file || entry.file === file))

/**
 * A path claim is a span whose first segment is a real entry of the repo root, of `web/`, or of
 * `web/src/` — or a bare file name with a source extension. Everything else that happens to carry a
 * slash (`origin/dev`, `memeon.ai/m/{id}`, `presence/{uid}`, `oceanseth/MemeOn`) names something
 * that is not a file in this tree, and is not this script's business.
 */
const ROOTS = [ROOT, WEB, join(WEB, "src")]
const heads = new Set(ROOTS.flatMap((base) => (existsSync(base) ? readdirSync(base) : [])))
const basenames = new Set(walk(ROOT, () => true).map((path) => path.slice(path.lastIndexOf("/") + 1)))
const SOURCE_EXT = /^[\w.@-]*[\w@-]\.(tsx?|mjs|json|css|mdx?|ya?ml|html|rhai|sh|toml)$/
/** A module specifier written without its extension (`lib/cn`, `stores/themeStore`). */
const EXTENSIONS = ["", ".ts", ".tsx", ".css", "/index.ts", "/index.tsx"]

const pathish = (text) => {
  // `useXScreen()`, `cn()`, `retain()`: a call, not a file.
  if (/^(https?:|#|mailto:|--)/.test(text) || /[\s`'"]/.test(text) || text.endsWith("()")) return false
  const head = text.split("/")[0]
  if (head === ".git") return false
  return (text.includes("/") && heads.has(head)) || (!text.includes("/") && SOURCE_EXT.test(text))
}

const TEMPLATE = /[<>{}$*]|…/
/**
 * Two kinds of path are real without being in the tree, and neither is this script's business:
 * a build output (`web/dist`, `api/lambda.zip`, `storybook-static`), which its own build makes,
 * and anything under `.beads/`, the local issue database bd generates and git excludes.
 */
const GENERATED = /(^|\/)(dist|storybook-static|node_modules|coverage|\.beads)(\/|$)|\.zip$/

const exists = (candidate, from = "") => {
  const cleaned = candidate.replace(/[.,;:)]+$/, "")
  if (GENERATED.test(cleaned)) return true
  // a link target is relative to the document that writes it
  if (from && existsSync(join(ROOT, from.slice(0, from.lastIndexOf("/")), cleaned))) return true
  // `copy/<surface>.ts`, `lib/*Model.ts`, `docs/…`: a placeholder segment means "a file of this
  // shape", so the deepest literal directory above it is what has to exist.
  if (TEMPLATE.test(cleaned)) {
    const parts = cleaned.split("/")
    const dir = parts.slice(0, parts.findIndex((part) => TEMPLATE.test(part))).join("/")
    return dir === "" || ROOTS.some((base) => existsSync(join(base, dir)))
  }
  for (const base of ROOTS) for (const ext of EXTENSIONS) if (existsSync(join(base, cleaned + ext))) return true
  return !cleaned.includes("/") && basenames.has(cleaned)
}

/**
 * The namespaces a custom property can open with: the ones the stylesheets actually declare, plus
 * Tailwind's own theme namespaces — so a token this app *removed* (`--tracking-title`) is still
 * recognised as a token claim rather than mistaken for a CLI flag (`--frozen-lockfile`).
 */
const NAMESPACES = new Set([
  ...[...properties].map((name) => name.slice(2).split("-")[0]),
  "color", "radius", "text", "font", "spacing", "container", "breakpoint", "animate", "tracking",
  "leading", "shadow", "ease", "blur", "aspect", "perspective",
])

/** The namespaces a utility class can carry a token name in. */
const CLASS_PREFIXES = {
  bg: "color", text: null, border: "color", ring: "color", "inset-ring": "color", outline: "color",
  fill: "color", stroke: "color", from: "color", via: "color", to: "color", decoration: "color",
  caret: "color", accent: "color", divide: "color", placeholder: "color",
  rounded: "radius", font: "font", tracking: "tracking", leading: "leading", animate: "animate",
  shadow: "shadow", "max-w": "container", "min-w": "container",
}
/** Stock Tailwind values that need no token of ours. */
const STOCK = new Set([
  "full", "none", "auto", "inherit", "current", "transparent", "balance", "pretty", "nowrap", "wrap",
  "left", "center", "right", "justify", "start", "end", "clip", "ellipsis", "sans", "serif", "mono",
  "thin", "light", "normal", "medium", "semibold", "bold", "black", "tight", "tighter", "wide", "wider",
  "widest", "snug", "relaxed", "loose", "spin", "ping", "pulse", "bounce", "xs", "sm", "md", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "base", "in", "out", "linear", "solid", "dashed", "dotted",
])

/** The documents that describe the component tree, where a capitalised backtick names a component. */
const TREE_DOCUMENTS = new Set(["README.md", "DESIGN.md", "web/src/Anatomy.mdx"])

/** Names the language owns, not this app. */
const GLOBALS = new Set(["Error", "Promise", "Date", "Map", "Set", "JSON", "Object", "Array", "String",
  "Number", "Boolean", "RegExp", "Intl", "Symbol", "Proxy", "Math", "WeakMap", "URL", "Response", "Request"])

const findings = []
const report = (file, line, message) => findings.push(`  ${file}:${line}  ${message}`)

for (const pattern of DOCUMENTS) {
  for (const file of expand(pattern)) {
    const lines = read(join(ROOT, file)).split("\n")
    let fenced = false
    lines.forEach((line, index) => {
      if (/^\s*```/.test(line)) fenced = !fenced
      const number = index + 1
      const say = (message) => report(file, number, message)

      // Markdown links and backticked spans are the only places a claim is made.
      const linked = [...line.matchAll(/\]\(([^)\s]+)\)/g)].map(([, target]) => target)
      const ticked = [...line.matchAll(/`([^`]+)`/g)].map(([, text]) => text)

      for (const target of linked) {
        if (/^(https?:|#|mailto:)/.test(target) || allows(file, target)) continue
        if (!exists(target, file)) say(`link target \`${target}\` does not exist`)
      }

      for (const text of ticked) {
        if (allows(file, text)) continue

        // 1. a component named through its tier, then a path
        const tiered = text.match(/^(?:@\/)?(?:atoms|molecules|organisms)\/([A-Z][A-Za-z0-9]+)$/)
        if (tiered && !tierExports.has(tiered[1])) {
          say(`component \`${tiered[1]}\` is exported by no file in src/atoms|molecules|organisms`)
          continue
        }

        if (pathish(text) && !exists(text)) {
          say(`path \`${text}\` does not exist`)
          continue
        }

        // 2. a custom property
        for (const [, name] of text.matchAll(/(--[a-z][a-z0-9-]*)/g)) {
          if (name.endsWith("-") || allows(file, name) || properties.has(name)) continue
          const [namespace] = name.slice(2).split("-")
          const inVar = new RegExp(`var\\(\\s*${name}[,)]`).test(text)
          if (!inVar && !(NAMESPACES.has(namespace) && name.slice(2).includes("-"))) continue
          say(`token \`${name}\` is declared nowhere in src/**/*.css`)
        }

        // 3. a utility class carrying a token name
        if (!/\s/.test(text)) {
          const bare = text.replace(/^-/, "").replace(/^[a-z-]+:/, "").replace(/\/\d+$/, "")
          for (const [prefix, namespace] of Object.entries(CLASS_PREFIXES)) {
            if (!bare.startsWith(`${prefix}-`)) continue
            const name = bare.slice(prefix.length + 1)
            if (!/^[a-z][a-z0-9-]*$/.test(name) || STOCK.has(name) || utilities.has(bare)) break
            // `text-` is both the type scale and a colour; either token makes the class real.
            const candidates = namespace ? [`--${namespace}-${name}`] : [`--text-${name}`, `--color-${name}`]
            if (!candidates.some((token) => properties.has(token))) {
              say(`class \`${text}\` names no ${candidates.map((token) => `\`${token}\``).join(" or ")} token`)
            }
            break
          }
        }

        // 4. a bare component name
        // A bare `Name` is only read as a component in the three documents that describe the
        // component tree; elsewhere a capitalised backtick is as likely to be a label or a file.
        // `EMLGLTTNC62L0` is an id, `XScreenModel` is the tree's metavariable for a screen's model,
        // `Error`/`Promise` are the language's, and `Makefile` is a file.
        const bare = TREE_DOCUMENTS.has(file) ? text.match(/^<?([A-Z][A-Za-z0-9]+)\s*\/?>?$/)?.[1] : undefined
        if (bare && /[a-z]/.test(bare) && !/^X[A-Z]/.test(bare) && !GLOBALS.has(bare) && !basenames.has(bare) && !identifiers.has(bare)) {
          say(`\`${bare}\` is declared nowhere in web/src, web/.storybook, shared, api/src or mobile/src`)
        }
      }

      // 5. commands, inside fences and out
      for (const [, workspace, script] of line.matchAll(/pnpm\s+(?:--filter\s+(\S+)\s+)?run\s+([\w:-]+)/g)) {
        const target = workspace ?? "."
        const known = scriptsOf[target]
        if (!known) say(`\`pnpm --filter ${workspace}\` is not a workspace`)
        else if (!known.has(script)) say(`\`pnpm${workspace ? ` --filter ${workspace}` : ""} run ${script}\` is not a script in ${WORKSPACES[target]}/package.json`)
      }
      for (const [, command] of line.matchAll(/(?<![\w-])(npm run [\w:-]+|npx\s+[\w@/.-]+)/g)) {
        if (allows(file, command)) continue
        say(`\`${command}\` — this workspace is pnpm (root package.json \`packageManager\`)`)
      }
      void fenced
    })
  }
}

const documents = DOCUMENTS.flatMap(expand)
if (findings.length) {
  console.error(
    `check-docs: ${findings.length} claim(s) in ${documents.length} document(s) name something the tree does not have:\n` +
      findings.join("\n") +
      `\n  fix the document, or add the name to web/scripts/docs-allowlist.json with a reason.`,
  )
  process.exit(1)
}

console.log(
  `check-docs: ${documents.length} document(s) checked; every path, token, class, component and script they name exists`,
)
