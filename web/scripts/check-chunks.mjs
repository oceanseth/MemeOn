#!/usr/bin/env node
/**
 * Lazy/eager split guard for the built JavaScript entry.
 *
 *   node scripts/check-chunks.mjs [distDir] [--src srcDir]
 *
 * Identifies the entry as the `assets/*.js.map` whose `sources` include a path ending
 * `src/main.tsx` (fallback `src/views/AppView.tsx`). Vite leaves shared modules (MemeCard,
 * `memeCardModel`, `cardMedia`, `react-router-dom`) in that entry because AppShell / QuestBar
 * and the public share routes import them statically — that is accepted and is not a failure.
 *
 * Fails (exit 1) when:
 *   - a lazy view from AppView (`BinderView`, `CreateMemeView`, `DevelopersView`, `FriendsView`,
 *     `LeaderboardView`, `MarketplaceView`, `SettingsView`, `TradesView`, or a later
 *     CreateMeme…View.tsx) appears under `src/views/` in the entry map
 *   - `src/views/LandingView.tsx` is missing from the entry (Landing must stay eager)
 *   - `screens/LandingScreen`, `screens/CreateMemeScreen`, or `lib/createMemeModel/**` import a
 *     hyphenated `meme-card` module path (not `data-slot="meme-card"`, not `CreateMemeCardModel`,
 *     not `memeCardModel`)
 *
 * Reads the shipped maps rather than guessing Vite's chunk graph. Source-map membership of
 * `meme-card` in a lazy chunk is not a mint-import detector: shared modules stay in the entry.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, isAbsolute, join, relative, resolve } from "node:path"
import ts from "typescript"

const display = (path) => {
  const short = relative(process.cwd(), path)
  return short && !short.startsWith("..") && !isAbsolute(short) ? short : path
}

const LAZY_VIEW_BASENAMES = new Set([
  "BinderView.tsx",
  "CreateMemeView.tsx",
  "DevelopersView.tsx",
  "FriendsView.tsx",
  "LeaderboardView.tsx",
  "MarketplaceView.tsx",
  "SettingsView.tsx",
  "TradesView.tsx",
])
const CREATE_MEME_VIEW = /^CreateMeme.*View\.tsx$/
const LANDING_VIEW = "src/views/LandingView.tsx"
const MAIN_ENTRY = "src/main.tsx"
const APP_VIEW_ENTRY = "src/views/AppView.tsx"
const IMPORT_OWNERS = [
  { rel: "screens/LandingScreen", label: "LandingScreen" },
  { rel: "screens/CreateMemeScreen", label: "CreateMemeScreen" },
]
const CREATE_MEME_MODEL = "lib/createMemeModel"

const args = process.argv.slice(2)
let srcArg
const positional = []
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]
  if (arg === "--src") {
    srcArg = args[i + 1]
    i += 1
    continue
  }
  if (arg.startsWith("--src=")) {
    srcArg = arg.slice("--src=".length)
    continue
  }
  if (!arg.startsWith("--")) positional.push(arg)
}

const dist = resolve(positional[0] ?? "dist")
const src = resolve(srcArg ?? join(import.meta.dirname, "..", "src"))
const assets = join(dist, "assets")

if (!existsSync(assets)) {
  console.error(`check-chunks: ${display(assets)} does not exist — run the build first`)
  process.exit(2)
}
if (!existsSync(src)) {
  console.error(`check-chunks: ${display(src)} does not exist`)
  process.exit(2)
}

const toPosix = (path) => path.replace(/\\/g, "/")

/** Strip schemes, query, hash; keep a path we can suffix-match. */
const normalizeSource = (source) => {
  let value = toPosix(String(source ?? ""))
  value = value.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
  const cut = value.search(/[?#]/)
  if (cut !== -1) value = value.slice(0, cut)
  try {
    value = decodeURIComponent(value)
  } catch {
    /* keep the raw path if it is not URI-encoded */
  }
  return value
}

const endsWithSrc = (source, suffix) => {
  const value = normalizeSource(source)
  return value === suffix || value.endsWith(`/${suffix}`)
}

const viewsBasename = (source) => {
  const value = normalizeSource(source)
  const match = value.match(/(?:^|\/)src\/views\/([^/]+)$/)
  return match ? match[1] : null
}

const isLazyView = (name) => LAZY_VIEW_BASENAMES.has(name) || CREATE_MEME_VIEW.test(name)

/** Hyphenated `meme-card` module path; not memeCardModel / CreateMemeCardModel. */
const isMemeCardSpecifier = (spec) => {
  const value = toPosix(spec).split("?")[0]
  return value.split("/").some((part) => part === "meme-card" || /^meme-card\.[cm]?[jt]sx?$/.test(part))
}

const scriptKindFor = (file) => {
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX
  return ts.ScriptKind.TS
}

const staticModuleSpecifier = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return undefined
}

const memeCardImportSpecs = (file) => {
  const source = readFileSync(file, "utf8")
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKindFor(file))
  const specs = []
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) {
      const spec = node.moduleSpecifier ? staticModuleSpecifier(node.moduleSpecifier) : undefined
      if (spec && isMemeCardSpecifier(spec)) specs.push(spec)
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0]
    ) {
      const spec = staticModuleSpecifier(node.arguments[0])
      if (spec && isMemeCardSpecifier(spec)) specs.push(spec)
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return specs
}

const readMapSources = (file) => {
  let raw = readFileSync(file, "utf8")
  if (raw.startsWith(")]}'")) raw = raw.slice(raw.indexOf("\n") + 1)
  let map
  try {
    map = JSON.parse(raw)
  } catch {
    return { error: "is not valid JSON" }
  }
  const listed = Array.isArray(map.sources) ? map.sources : []
  const root = typeof map.sourceRoot === "string" ? map.sourceRoot : ""
  const sources = listed
    .filter((source) => typeof source === "string" && source.length > 0)
    .map((source) => {
      if (!root) return source
      const normalized = toPosix(source)
      if (isAbsolute(normalized) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) return source
      return `${root.replace(/\/?$/, "/")}${source}`
    })
  return { sources }
}

const maps = readdirSync(assets)
  .filter((name) => name.endsWith(".js.map"))
  .sort()
  .map((name) => {
    const file = join(assets, name)
    const parsed = readMapSources(file)
    return { name, file, ...parsed }
  })

if (maps.length === 0) {
  console.error(
    `check-chunks: no JavaScript source maps in ${display(assets)} — the build must emit sourcemap: true`,
  )
  process.exit(2)
}

const invalid = maps.filter((map) => map.error)
if (invalid.length > 0) {
  for (const map of invalid) console.error(`check-chunks: ${display(map.file)} ${map.error}`)
  process.exit(2)
}

const withMain = maps.filter((map) => map.sources.some((source) => endsWithSrc(source, MAIN_ENTRY)))
const withAppView = maps.filter((map) => map.sources.some((source) => endsWithSrc(source, APP_VIEW_ENTRY)))
const entryMaps = withMain.length > 0 ? withMain : withAppView

if (entryMaps.length === 0) {
  console.error(
    `check-chunks: no entry map under ${display(assets)} — need a *.js.map whose sources end with ${MAIN_ENTRY} (fallback ${APP_VIEW_ENTRY})`,
  )
  process.exit(2)
}

const problems = []
const entrySources = entryMaps.flatMap((map) => map.sources.map((source) => ({ source, map: map.name })))

let landingFound = false
for (const { source, map } of entrySources) {
  if (endsWithSrc(source, LANDING_VIEW)) landingFound = true
  const name = viewsBasename(source)
  if (name && isLazyView(name)) {
    problems.push(
      `entry ${map} contains lazy view src/views/${name} — keep it behind lazy() so it does not land in the entry`,
    )
  }
}
if (!landingFound) {
  problems.push(`${LANDING_VIEW} is missing from the entry — Landing must stay eager`)
}

const sourceRel = (file) => toPosix(relative(src, file))
const isSkipped = (name) => /\.(test|spec|stories)\./.test(name)
const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((entry) => {
        const file = join(dir, entry)
        return statSync(file).isDirectory() ? walk(file) : [file]
      })
    : []

const resolveTs = (rel) => {
  for (const extension of [".tsx", ".ts"]) {
    const file = join(src, rel + extension)
    if (existsSync(file) && statSync(file).isFile()) return file
  }
  return undefined
}

const checkFile = (file) => {
  for (const spec of memeCardImportSpecs(file)) {
    problems.push(`${sourceRel(file)} imports "${spec}" — Landing/Create/createMemeModel must not import meme-card`)
  }
}

for (const owner of IMPORT_OWNERS) {
  const file = resolveTs(owner.rel)
  if (!file) {
    problems.push(`${owner.rel}.tsx is missing — cannot verify it does not import meme-card`)
    continue
  }
  checkFile(file)
}

const modelDir = join(src, CREATE_MEME_MODEL)
if (!existsSync(modelDir) || !statSync(modelDir).isDirectory()) {
  problems.push(`${CREATE_MEME_MODEL} is missing — cannot verify it does not import meme-card`)
} else {
  for (const file of walk(modelDir)) {
    if (!/\.tsx?$/.test(file) || isSkipped(basename(file))) continue
    checkFile(file)
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`check-chunks: ${problem}`)
  console.error(`check-chunks: ${problems.length} lazy-chunk problem(s) under ${display(dist)}`)
  process.exit(1)
}

const entryNames = entryMaps.map((map) => map.name).join(", ")
console.log(
  `check-chunks: entry ${entryNames} keeps ${LANDING_VIEW} eager and the lazy views out; Landing/Create/createMemeModel do not import meme-card (${display(dist)})`,
)
