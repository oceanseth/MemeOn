#!/usr/bin/env node
/**
 * Ratchet on user-facing strings spelled outside `copy/`.
 *
 *   node scripts/check-copy.mjs [srcDir] [--update] [--list] [--baseline=<file>]
 *
 * Counts copy-like string literals per engine file (hooks/, lib/*Model.ts,
 * lib/createMemeModel/) and compares them with scripts/copy-baseline.json.
 * A file may only match or drop below its baseline; a new file starts at 0.
 * `--update` rewrites the baseline after a drop and refuses to raise any count,
 * so the only way up is to move the string into copy/<surface>.ts.
 *
 * "Copy-like" is a heuristic, on purpose: two or more words, or one Capitalised
 * word. Paths, URLs, CSS, media queries, import specifiers, object keys, literal
 * types and `new Error(…)` messages are not counted. It over-counts a little
 * rather than missing a caption; the baseline absorbs the noise.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, resolve, sep } from "node:path"
import ts from "typescript"

const args = process.argv.slice(2)
const update = args.includes("--update")
const list = args.includes("--list")
const positional = args.filter((arg) => !arg.startsWith("--"))
const src = resolve(positional[0] ?? "src")
const baselineArg = args.find((arg) => arg.startsWith("--baseline="))?.slice("--baseline=".length)
const baselineFile = baselineArg ? resolve(baselineArg) : resolve(import.meta.dirname, "copy-baseline.json")

if (!existsSync(src)) {
  console.error(`check-copy: ${src} does not exist`)
  process.exit(2)
}

const toSourcePath = (file) => relative(src, file).split(sep).join("/")
const isTestLike = (name) => /\.(test|spec|stories|runtime)\./.test(name)
const inScope = (sourcePath) => {
  if (!/\.tsx?$/.test(sourcePath) || isTestLike(sourcePath)) return false
  if (sourcePath.startsWith("hooks/")) return true
  if (/^lib\/[^/]*Model\.ts$/.test(sourcePath)) return true
  return sourcePath.startsWith("lib/createMemeModel/")
}

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((entry) => {
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
}) : [])

/** Two or more words with a letter in them, or exactly one Capitalised word (`Settings`, `Tier-ups`). */
const isCopyLike = (raw) => {
  const text = raw.trim()
  if (/^[/(]|:\/\/|^var\(/.test(text)) return false
  if (/\S\s+\S/.test(text)) return /\p{L}/u.test(text)
  return /^\p{Lu}\p{Ll}+(-\p{Ll}+)?$/u.test(text)
}

const isDeveloperMessage = (node) => {
  const parent = node.parent
  if (!parent) return false
  if (ts.isNewExpression(parent) && ts.isIdentifier(parent.expression) && /Error$/.test(parent.expression.text)) return true
  if (ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression) && ts.isIdentifier(parent.expression.expression) && parent.expression.expression.text === "console") return true
  return false
}

const isNotCopyPosition = (node) => {
  const parent = node.parent
  if (!parent) return false
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent)) return true
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true
  if (ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword) return true
  return isDeveloperMessage(node)
}

const countCopyLiterals = (file) => {
  const sourceFile = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const hits = []
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isNotCopyPosition(node) && isCopyLike(node.text)) hits.push(node.text)
    } else if (ts.isTemplateExpression(node) && !isNotCopyPosition(node)) {
      const text = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("")
      if (isCopyLike(text)) hits.push(text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return hits
}

const counts = {}
for (const file of [...walk(join(src, "hooks")), ...walk(join(src, "lib"))]) {
  const sourcePath = toSourcePath(file)
  if (!inScope(sourcePath)) continue
  const hits = countCopyLiterals(file)
  if (hits.length > 0) counts[sourcePath] = hits.length
  if (list && hits.length > 0) console.log(`${sourcePath} (${hits.length})\n${hits.map((hit) => `  ${JSON.stringify(hit)}`).join("\n")}`)
}

const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

if (!existsSync(baselineFile)) {
  if (!update) {
    console.error(`check-copy: no baseline at ${relative(process.cwd(), baselineFile)}; create it with --update`)
    process.exit(1)
  }
  writeFileSync(baselineFile, `${JSON.stringify(counts, null, 2)}\n`)
  console.log(`check-copy: baseline written, ${total} copy-like literal(s) outside copy/`)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(baselineFile, "utf8"))
const files = [...new Set([...Object.keys(baseline), ...Object.keys(counts)])].sort()
const grew = []
const shrank = []
for (const file of files) {
  const before = baseline[file] ?? 0
  const after = counts[file] ?? 0
  if (after > before) grew.push(`  ${file}: ${before} → ${after}`)
  else if (after < before) shrank.push(`  ${file}: ${before} → ${after}`)
}

if (grew.length > 0) {
  console.error(`check-copy: ${grew.length} file(s) spell more copy than the baseline allows\n${grew.join("\n")}\n  move the string into copy/<surface>.ts and read it from there`)
  process.exit(1)
}

if (shrank.length > 0) {
  if (update) {
    writeFileSync(baselineFile, `${JSON.stringify(counts, null, 2)}\n`)
    console.log(`check-copy: baseline lowered for ${shrank.length} file(s), ${total} copy-like literal(s) remain outside copy/`)
    process.exit(0)
  }
  console.error(`check-copy: ${shrank.length} file(s) dropped below the baseline\n${shrank.join("\n")}\n  lock it in: pnpm --filter web run check-copy -- --update`)
  process.exit(1)
}

console.log(`check-copy: ${total} copy-like literal(s) outside copy/, at baseline`)
