#!/usr/bin/env node
/**
 * Landing / mint lazy-chunk contract for the Vite build.
 *
 *   node scripts/check-chunks.mjs [distDir]
 *
 * The entry is the `assets/*.js.map` whose `sources` include `src/main.tsx` or
 * `src/views/AppView.tsx`. `build.sourcemap` is on in `vite.config.ts`; there is no
 * `manualChunks`. That map already contains `meme-card`, `memeCardModel`, `cardMedia`,
 * and `react-router-dom` because AppShell → QuestBar → MemeCard is static and the
 * public share routes are eager. That is accepted — this check does not fail on it.
 *
 * Fails (exit 1) if:
 *   - a lazy view module is in the entry map (BinderView, CreateMemeView,
 *     CreateMeme*View, DevelopersView, FriendsView, LeaderboardView,
 *     MarketplaceView, SettingsView, TradesView)
 *   - LandingView.tsx is missing from the entry (Landing stays eager)
 *   - screens/LandingScreen.tsx, screens/CreateMemeScreen.tsx, or
 *     lib/createMemeModel/** statically import a module whose last segment is
 *     `meme-card` (path-agnostic after the MemeCard promotion). data-slot="meme-card"
 *     is chrome, not an import.
 *
 * `src` is inferred as `../src` from the dist dir (web/dist → web/src).
 *
 * A missing dist, missing maps, or missing entry map is exit 2 (run the build first).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path"
import ts from "typescript"

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const dist = resolve(positional[0] ?? "dist")
const src = resolve(dist, "..", "src")
const assets = join(dist, "assets")

/** Repo-relative where that reads, absolute where it would be a stack of `..`. */
const display = (path) => {
  const short = relative(process.cwd(), path)
  return short && !short.startsWith("..") && !isAbsolute(short) ? short : path
}

const displaySrc = (sourcePath) => {
  const file = join(src, sourcePath)
  const short = relative(process.cwd(), file)
  return short && !short.startsWith("..") && !isAbsolute(short) ? short : sourcePath
}

if (!existsSync(assets)) {
  console.error(`check-chunks: ${assets} does not exist — run the build first`)
  process.exit(2)
}

if (!existsSync(src)) {
  console.error(`check-chunks: ${src} does not exist — expected src next to dist`)
  process.exit(2)
}

const maps = readdirSync(assets)
  .filter((name) => name.endsWith(".js.map"))
  .sort()

if (maps.length === 0) {
  console.error(`check-chunks: no JavaScript source maps in ${display(assets)} — the build needs sourcemap: true`)
  process.exit(2)
}

const normalizeSource = (source) => String(source).replaceAll("\\", "/").replace(/^\0+/, "").split("?")[0]

const basenameOf = (source) => {
  const normalized = normalizeSource(source)
  const slash = normalized.lastIndexOf("/")
  return slash === -1 ? normalized : normalized.slice(slash + 1)
}

const isEntryMarker = (source) => {
  const normalized = normalizeSource(source)
  return /(?:^|\/)src\/main\.tsx$/.test(normalized) || /(?:^|\/)src\/views\/AppView\.tsx$/.test(normalized)
}

/** Eight AppView lazy() views, plus future CreateMeme*View mint splits (mo-qff.3). */
const LAZY_VIEW = /^(?:BinderView|DevelopersView|FriendsView|LeaderboardView|MarketplaceView|SettingsView|TradesView|CreateMeme.*View)\.tsx$/
const isLazyView = (source) => LAZY_VIEW.test(basenameOf(source))
const isLandingView = (source) => basenameOf(source) === "LandingView.tsx"

const problems = []
const report = (where, message) => problems.push(`${where}: ${message}`)

const entryMaps = []
for (const name of maps) {
  const file = join(assets, name)
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"))
  } catch {
    report(display(file), "is not valid source-map JSON")
    continue
  }
  const sources = Array.isArray(parsed.sources) ? parsed.sources.map(String) : []
  if (sources.some(isEntryMarker)) entryMaps.push({ file, sources })
}

if (entryMaps.length === 0) {
  console.error(
    `check-chunks: no entry source map under ${display(assets)} (a *.js.map whose sources include src/main.tsx or src/views/AppView.tsx) — run vite build with sourcemap: true`,
  )
  process.exit(2)
}

const entrySources = entryMaps.flatMap((entry) => entry.sources)
if (!entrySources.some(isLandingView)) {
  const where = entryMaps.map((entry) => display(entry.file)).join(", ")
  report(where, "LandingView.tsx is missing from the entry — Landing must stay eager")
}

for (const entry of entryMaps) {
  const seen = new Set()
  for (const source of entry.sources) {
    if (!isLazyView(source)) continue
    const name = basenameOf(source)
    if (seen.has(name)) continue
    seen.add(name)
    report(
      display(entry.file),
      `lazy view ${name} is in the entry — keep it behind lazy() in AppView.tsx`,
    )
  }
}

const toSourcePath = (file) => relative(src, file).split(sep).join("/")
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo"])
const isSkipped = (name) => /\.(test|spec|stories)\./.test(name)
const isSource = (name) => /\.tsx?$/.test(name) && !isSkipped(name)

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((entry) => {
  if (SKIP_DIRS.has(entry)) return []
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
}) : [])

const scriptKindFor = (file) => {
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX
  return ts.ScriptKind.TS
}

const staticModuleSpecifier = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return undefined
}

const isMemeCardSpecifier = (spec) => {
  const last = spec.replaceAll("\\", "/").split("/").pop() ?? spec
  return last.replace(/\.[cm]?[jt]sx?$/, "") === "meme-card"
}

const memeCardImports = (file, source) => {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKindFor(file))
  const found = []
  const add = (node) => {
    const spec = staticModuleSpecifier(node)
    if (spec === undefined || !isMemeCardSpecifier(spec)) return
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
    found.push({ spec, line: line + 1 })
  }
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) add(node.moduleSpecifier)
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) add(node.moduleSpecifier)
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0]) {
      add(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

const IMPORT_FILES = ["screens/LandingScreen.tsx", "screens/CreateMemeScreen.tsx"]
const MODEL_DIR = "lib/createMemeModel"

for (const sourcePath of IMPORT_FILES) {
  const file = join(src, sourcePath)
  if (!existsSync(file)) {
    report(displaySrc(sourcePath), "is missing — Landing/Create must not import meme-card")
    continue
  }
  const source = readFileSync(file, "utf8")
  for (const { spec, line } of memeCardImports(file, source)) {
    report(
      `${displaySrc(sourcePath)}:${line}`,
      `imports meme-card via "${spec}" — Landing/Create use FoilCard chrome, not MemeCard`,
    )
  }
}

const modelDir = join(src, MODEL_DIR)
if (!existsSync(modelDir)) {
  report(displaySrc(MODEL_DIR), "is missing — createMemeModel must not import meme-card")
} else {
  for (const file of walk(modelDir)) {
    const name = basename(file)
    if (!isSource(name)) continue
    const sourcePath = toSourcePath(file)
    const source = readFileSync(file, "utf8")
    for (const { spec, line } of memeCardImports(file, source)) {
      report(
        `${displaySrc(sourcePath)}:${line}`,
        `imports meme-card via "${spec}" — Landing/Create use FoilCard chrome, not MemeCard`,
      )
    }
  }
}

if (problems.length > 0) {
  console.error(`check-chunks: ${problems.length} landing/mint chunk problem(s)\n${problems.map((line) => `  ${line}`).join("\n")}`)
  process.exit(1)
}

const entryList = entryMaps.map((entry) => display(entry.file)).join(", ")
console.log(
  `check-chunks: entry keeps LandingView.tsx (${entryList}); lazy views stay out of the entry; Landing/Create/createMemeModel do not import meme-card (${display(dist)})`,
)
