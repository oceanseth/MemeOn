#!/usr/bin/env node
/**
 * After `pnpm dlx shadcn add <item>` (never `init`): registry files import stock `cn` from "cn",
 * and this app's merge is `@/lib/cn` (`createCn` with the material class group and container
 * `card-narrow`). A second copy typechecks and skips the merge. Rewrites every `from "cn"` under
 * src/ to `@/lib/cn` and lists what it touched.
 *
 *   node scripts/shadcn-postadd.mjs [srcDir]
 *
 * The `aliases.utils` entry in components.json is not applied to that import by the CLI; this is.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const src = resolve(process.argv[2] ?? "src")
const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
})

const CN_IMPORT = /(\bfrom\s*)(['"])cn\2/g
let touched = 0
for (const file of walk(src).filter((name) => /\.(ts|tsx)$/.test(name))) {
  const before = readFileSync(file, "utf8")
  const after = before.replace(CN_IMPORT, (_, from, quote) => `${from}${quote}@/lib/cn${quote}`)
  if (after === before) continue
  writeFileSync(file, after)
  touched += 1
  console.log(`shadcn-postadd: ${relative(process.cwd(), file)} now imports cn from @/lib/cn`)
}
console.log(`shadcn-postadd: ${touched} file(s) rewritten under ${relative(process.cwd(), src) || "."}`)
