import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-layers.mjs")

const runChecker = (files) => {
  const dist = mkdtempSync(join(tmpdir(), "memeon-layer-check-"))
  try {
    mkdirSync(join(dist, "assets"), { recursive: true })
    for (const [path, contents] of Object.entries(files)) {
      const file = join(dist, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, dist], { encoding: "utf8" })
    return { status: result.status, output: result.stdout + result.stderr }
  } finally {
    rmSync(dist, { recursive: true, force: true })
  }
}

const ORDER = "@layer properties,theme,base,components,utilities;"
const BODY = "@layer components{.a{color:red}}@layer utilities{.b{color:teal}}"
// What Tailwind and lightningcss actually emit once `index.css` leads the bundle: the order
// statement is gone, respelled as blocks in the same order with a bare `@layer components;`
// standing in for the layer this app fills from its own stylesheets.
const RESPELLED =
  "@layer properties{*{--tw-x:0}}@layer theme{:root{--color-bg:#000}}@layer base{*{margin:0}}" +
  "@layer components;@layer utilities{.b{color:teal}}"

test("accepts a bundle that opens with the order statement, with or without properties", () => {
  const result = runChecker({
    "assets/index-abc123.css": ORDER + BODY,
    "assets/Skeleton-def456.css":
      "@layer theme,base,components,utilities;@layer components{@keyframes s{to{opacity:1}}}",
    "assets/fonts-789.css": "@font-face{font-family:x;src:url(x.woff2)}",
  })

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /3 stylesheet\(s\), 2 layered/)
})

test("accepts the order respelled as blocks, which is how the real bundle ships it", () => {
  const result = runChecker({ "assets/index-abc123.css": RESPELLED })

  assert.equal(result.status, 0, result.output)
})

test("rejects a bundle whose first declaration is a bare components block", () => {
  const result = runChecker({
    "assets/index-abc123.css": "@layer components{@keyframes atom-rot{to{transform:rotate(360deg)}}}" + RESPELLED,
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /ranks its layers components < properties < theme < base < utilities/)
  assert.match(result.output, /has to rank theme < base < components < utilities/)
  assert.match(result.output, /opens with a bare @layer components \{ … \} block/)
})

test("rejects a components block wedged in ahead of base", () => {
  const result = runChecker({
    "assets/index-abc123.css":
      "@layer theme{:root{--a:1}}@layer components{.a{color:red}}@layer base{*{margin:0}}@layer utilities{.b{color:teal}}",
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /ranks its layers theme < components < base < utilities/)
  // the sheet does not open with the offending block, so only the order is reported
  assert.doesNotMatch(result.output, /opens with a bare/)
})

test("rejects an order statement that inverts base and components, or drops a layer", () => {
  const inverted = runChecker({ "assets/index-abc123.css": "@layer theme,components,base,utilities;" + BODY })
  const incomplete = runChecker({ "assets/index-abc123.css": "@layer theme,base,utilities;" + BODY })

  assert.equal(inverted.status, 1, inverted.output)
  assert.match(inverted.output, /has to rank theme < base < components < utilities/)
  assert.equal(incomplete.status, 1, incomplete.output)
  assert.match(incomplete.output, /has to rank theme < base < components < utilities/)
})

test("rejects properties ranked above theme, where Tailwind's @property fallbacks would beat utilities", () => {
  const result = runChecker({
    "assets/index-abc123.css": "@layer theme,base,components,utilities;" + BODY + "@layer properties{*{--tw-x:0}}",
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /@property fallbacks live in "properties" and have to rank below "theme"/)
})

test("reads through comments and strings rather than trusting the first @layer-looking text", () => {
  const result = runChecker({
    "assets/index-abc123.css": '/* @layer components { */.a:before{content:"@layer components {"}' + ORDER + BODY,
  })

  assert.equal(result.status, 0, result.output)
})

test("exits 2 when there is nothing built to check", () => {
  const missing = spawnSync(process.execPath, [checker, join(tmpdir(), "memeon-layer-check-absent")], {
    encoding: "utf8",
  })
  const empty = runChecker({})

  assert.equal(missing.status, 2, missing.stdout + missing.stderr)
  assert.match(missing.stderr, /does not exist — run the build first/)
  assert.equal(empty.status, 2, empty.output)
  assert.match(empty.output, /the build emitted no CSS/)
})
