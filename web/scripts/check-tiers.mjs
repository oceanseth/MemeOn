#!/usr/bin/env node
/**
 * Structural check for a molecularized React `src/`.
 *
 *   node scripts/check-tiers.mjs [srcDir] [--legacy a,b] [--baseline file] [--write-baseline file]
 *
 * Fails (exit 1) on:
 *   - a value import from a higher tier, or from hooks/ or stores/, below views/
 *   - a React state hook (useState, useReducer, useEffect, useLayoutEffect,
 *     useContext, useSyncExternalStore) in a component below views/
 *   - a state-library import (mobx, zustand, redux, react-query, ...) below views/
 *   - a component in a tier folder without a sibling *.stories.tsx
 *   - a component outside any tier folder (the flat-folder regression)
 *
 * Retrofit support:
 *   --legacy components,pages   Folders still being migrated. Files inside are not
 *                               checked; tier files importing from them are reported,
 *                               so the count ratchets down as the migration proceeds.
 *   --write-baseline .tiers-baseline.json   Record today's problems and exit 0.
 *   --baseline .tiers-baseline.json         Fail only on problems not in the baseline;
 *                                           report the ones that went away.
 *
 * Type-only imports are ignored: they are erased and carry no behavior.
 * No dependencies; relative imports only (package imports are checked by name).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, relative, resolve, sep } from "node:path"

const TIERS = ["atoms", "molecules", "organisms", "screens", "views"]
const ENGINES = ["hooks", "stores"]
const ALLOWED = {
  atoms: ["atoms"],
  molecules: ["atoms", "molecules"],
  organisms: ["atoms", "molecules", "organisms"],
  screens: ["atoms", "molecules", "organisms", "screens"],
  views: [...TIERS, ...ENGINES],
}
const STATE_HOOKS = /\buse(State|Reducer|Effect|LayoutEffect|Context|SyncExternalStore)\s*\(/
const STATE_LIBS = /^(mobx|mobx-react(-lite)?|zustand|jotai|valtio|recoil|redux|@reduxjs\/toolkit|react-redux|@tanstack\/react-query|swr|@xstate\/react|xstate)(\/|$)/
const IMPORT = /^\s*import\s+([^;]*?)\s+from\s+["']([^"']+)["']/gm

// ── args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"))
const src = resolve(positional[0] ?? "src")
const legacy = (flag("--legacy") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const baselineFile = flag("--baseline")
const writeBaselineFile = flag("--write-baseline")

if (!existsSync(src)) {
  console.error(`check-tiers: ${src} does not exist`)
  process.exit(2)
}

// ── helpers ───────────────────────────────────────────────────────────────
const isComponentFile = (name) =>
  /\.(tsx|jsx)$/.test(name) && !/\.(stories|test|spec)\.(tsx|jsx)$/.test(name)

const isTypeOnly = (clause) => {
  if (/^type\s/.test(clause.trim())) return true
  const braces = clause.match(/\{([^}]*)\}/)
  if (!braces) return false
  const specifiers = braces[1].split(",").map((s) => s.trim()).filter(Boolean)
  const hasDefault = /^[A-Za-z_$][\w$]*\s*,/.test(clause.trim())
  return !hasDefault && specifiers.length > 0 && specifiers.every((s) => /^type\s/.test(s))
}

/** Which top-level folder under src a resolved import lands in, if any. */
const folderOf = (fromFile, spec) => {
  if (!spec.startsWith(".")) return undefined
  const target = resolve(dirname(fromFile), spec)
  const rel = relative(src, target)
  if (rel.startsWith("..")) return undefined
  const [first] = rel.split(sep)
  return first && first.includes(".") ? undefined : first
}

const problems = []
const report = (file, message) => problems.push(`${relative(src, file)}: ${message}`)
let components = 0
let stories = 0

// ── tier folders ──────────────────────────────────────────────────────────
for (const tier of TIERS) {
  const dir = join(src, tier)
  if (!existsSync(dir) || !statSync(dir).isDirectory()) continue
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (!statSync(file).isFile()) continue
    if (/\.stories\.(tsx|jsx)$/.test(name)) {
      stories += 1
      continue
    }
    if (!isComponentFile(name)) continue
    components += 1
    const text = readFileSync(file, "utf8")

    const story = join(dir, name.replace(/\.(tsx|jsx)$/, ".stories.$1"))
    if (!existsSync(story)) report(file, `no sibling ${basename(story)}`)

    if (tier !== "views" && STATE_HOOKS.test(text)) {
      report(file, "React state hook below views/ (lift it into hooks/ and pass a prop)")
    }

    for (const match of text.matchAll(IMPORT)) {
      const [, clause, spec] = match
      if (isTypeOnly(clause)) continue
      if (tier !== "views" && STATE_LIBS.test(spec)) {
        report(file, `imports state library "${spec}" below views/`)
        continue
      }
      const folder = folderOf(file, spec)
      if (folder === undefined) continue
      if (legacy.includes(folder)) {
        report(file, `${tier} still imports legacy ${folder}/ ("${spec}")`)
      } else if ((TIERS.includes(folder) || ENGINES.includes(folder)) && !ALLOWED[tier].includes(folder)) {
        report(file, `${tier} imports from ${folder}/ ("${spec}")`)
      }
    }
  }
}

// ── strays: components outside any tier or legacy folder ──────────────────
for (const name of readdirSync(src)) {
  const file = join(src, name)
  if (statSync(file).isFile() && isComponentFile(name) && name !== "main.tsx") {
    report(file, "component outside a tier folder")
  }
}

// ── baseline ratchet ──────────────────────────────────────────────────────
const where = relative(process.cwd(), src) || "."
const summary = `${components} components, ${stories} story files${legacy.length ? `, legacy: ${legacy.join(", ")}` : ""}`

if (writeBaselineFile) {
  writeFileSync(writeBaselineFile, JSON.stringify({ src: where, problems: problems.sort() }, null, 2) + "\n")
  console.log(`check-tiers: wrote ${problems.length} known problem(s) to ${writeBaselineFile} (${summary})`)
  process.exit(0)
}

if (baselineFile) {
  const known = new Set(JSON.parse(readFileSync(baselineFile, "utf8")).problems)
  const fresh = problems.filter((p) => !known.has(p))
  const fixed = [...known].filter((p) => !problems.includes(p))
  console.log(`check-tiers: ${problems.length - fresh.length} known, ${fixed.length} fixed since baseline, ${fresh.length} new (${summary})`)
  if (fixed.length > 0) console.log("  fixed:\n" + fixed.map((p) => `    ${p}`).join("\n"))
  if (fresh.length > 0) {
    console.error("  new:\n" + fresh.map((p) => `    ${p}`).join("\n"))
    process.exit(1)
  }
  if (fixed.length > 0) console.log(`  (refresh the baseline: --write-baseline ${baselineFile})`)
  process.exit(0)
}

if (problems.length > 0) {
  console.error(`check-tiers: ${problems.length} problem(s) (${summary})\n` + problems.map((p) => `  ${p}`).join("\n"))
  process.exit(1)
}
console.log(`check-tiers: ${summary}, tiers clean (${where})`)
