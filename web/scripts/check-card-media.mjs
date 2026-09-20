#!/usr/bin/env node
/**
 * Location ratchet for the meme card's shared viewport observer and paused foil ring.
 *
 *   node scripts/check-card-media.mjs [srcDir]
 *
 * `lib/cardMedia.ts` owns the one IntersectionObserver every card shares (constructed as
 * ViewportObserver so tests can stub the platform) and the only `setProperty` /
 * `removeProperty` of `--glow-play-state`. `hooks/useMarketplaceCatalog.ts` may construct
 * a *different* observer for the infinite-scroll sentinel. The MemeCard molecule applies
 * `model.cardRef`; it does not construct an observer.
 *
 * Fails (exit 1) unless:
 *   - the identifier IntersectionObserver appears only in lib/cardMedia.ts and
 *     hooks/useMarketplaceCatalog.ts
 *   - `new IntersectionObserver` appears only in hooks/useMarketplaceCatalog.ts
 *   - setProperty('--glow-play-state' / removeProperty('--glow-play-state' appear only in
 *     lib/cardMedia.ts
 *   - every *meme-card* component file contains zero IntersectionObserver tokens and still
 *     has ref={model.cardRef}
 *
 * Tests, stories and mdx are skipped (they may mock IntersectionObserver). CSS may declare
 * and read `--glow-play-state`; mutation is a JS concern.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, join, relative, resolve, sep } from "node:path"

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const src = resolve(positional[0] ?? "src")

if (!existsSync(src)) {
  console.error(`check-card-media: ${src} does not exist`)
  process.exit(2)
}

const toSourcePath = (file) => relative(src, file).split(sep).join("/")
const isSkipped = (name) => /\.(test|spec|stories)\./.test(name) || /\.mdx$/.test(name)
const isSource = (name) => /\.tsx?$/.test(name) && !isSkipped(name)
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".turbo"])

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((entry) => {
  if (SKIP_DIRS.has(entry)) return []
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
}) : [])

const IO_ALLOWED = new Set(["lib/cardMedia.ts", "hooks/useMarketplaceCatalog.ts"])
const NEW_IO_ALLOWED = new Set(["hooks/useMarketplaceCatalog.ts"])
const GLOW_ALLOWED = new Set(["lib/cardMedia.ts"])
const GLOW = /(?:setProperty|removeProperty)\(\s*(['"])--glow-play-state\1/
const NEW_IO = /new\s+IntersectionObserver\b/
const IO_IDENT = /\bIntersectionObserver\b/

const findings = []
const report = (where, message) => findings.push(`  ${where}  ${message}`)

let sawCardMedia = false
const memeCards = []

for (const file of walk(src)) {
  const name = basename(file)
  if (!isSource(name)) continue
  const sourcePath = toSourcePath(file)
  if (sourcePath === "lib/cardMedia.ts") sawCardMedia = true
  const isCard = name.includes("meme-card")
  if (isCard) memeCards.push(sourcePath)

  const source = readFileSync(file, "utf8")
  source.split("\n").forEach((line, index) => {
    const where = `${sourcePath}:${index + 1}`
    const isNew = NEW_IO.test(line)
    const isIdent = IO_IDENT.test(line)
    if (isCard && (isNew || isIdent)) {
      report(where, "IntersectionObserver token — the card applies model.cardRef, it does not construct an observer")
    } else if (isNew && !NEW_IO_ALLOWED.has(sourcePath)) {
      report(where, "`new IntersectionObserver` — use the ViewportObserver alias; the constructor stays in hooks/useMarketplaceCatalog.ts")
    } else if (isIdent && !IO_ALLOWED.has(sourcePath)) {
      report(where, "IntersectionObserver identifier — keep it in lib/cardMedia.ts or hooks/useMarketplaceCatalog.ts")
    }
    if (GLOW.test(line) && !GLOW_ALLOWED.has(sourcePath)) {
      report(where, "setProperty / removeProperty('--glow-play-state') — mutate it only in lib/cardMedia.ts")
    }
  })

  if (isCard) {
    if (!source.includes("ref={model.cardRef}")) report(sourcePath, "missing ref={model.cardRef}")
  }
}

if (!sawCardMedia) {
  findings.unshift("  lib/cardMedia.ts is missing — it owns the shared observer and --glow-play-state")
}
if (memeCards.length === 0) {
  findings.push("  no *meme-card* component under src — the card must apply model.cardRef")
}

if (findings.length > 0) {
  console.error(`check-card-media: ${findings.length} location(s) break the card-media owner contract\n${findings.join("\n")}`)
  process.exit(1)
}

const cardList = memeCards.join(", ")
console.log(
  `check-card-media: IntersectionObserver stays in lib/cardMedia.ts and hooks/useMarketplaceCatalog.ts; --glow-play-state mutation stays in lib/cardMedia.ts; ${cardList} delegates via model.cardRef`,
)
