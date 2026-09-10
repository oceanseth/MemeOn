import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-contrast.mjs")
const appStylesheet = resolve(import.meta.dirname, "..", "src", "index.css")

const run = (path) => {
  const result = spawnSync(process.execPath, [checker, path], { encoding: "utf8" })
  return { status: result.status, output: result.stdout + result.stderr }
}

/** A stylesheet shaped like `src/index.css`: an `@theme static` block and a base-layer `:root`. */
const stylesheet = (overrides = {}) => {
  const tokens = {
    "--color-bg": "oklch(0.16 0.015 272.199)",
    "--color-bg-raised": "oklch(0.206 0.023 268.889)",
    "--color-bg-card": "oklch(0.228 0.028 268.958)",
    "--color-text": "oklch(0.942 0.012 264.509)",
    "--color-text-dim": "oklch(0.77 0.032 267.093)",
    "--color-text-inverse": "oklch(1 0 0)",
    "--color-accent": "oklch(0.832 0.102 231.822)",
    "--color-danger": "oklch(0.8 0.115 21.864)",
    "--color-danger-fill": "oklch(0.477 0.153 18.308)",
    "--color-ok": "oklch(0.906 0.158 155.414)",
    ...overrides,
  }
  const declare = (entries) => entries.map(([k, v]) => `  ${k}: ${v};`).join("\n")
  return (
    `@theme static {\n${declare(Object.entries(tokens))}\n}\n\n@layer base {\n  :root {\n` +
    declare([
      ["--state-error-bg", "color-mix(in oklab, var(--color-danger) 12%, transparent)"],
      ["--state-success-bg", "color-mix(in oklab, var(--color-ok) 12%, transparent)"],
    ]) +
    "\n  }\n}\n"
  )
}

const withStylesheet = (css, assertions) => {
  const dir = mkdtempSync(join(tmpdir(), "memeon-contrast-"))
  try {
    const path = join(dir, "index.css")
    writeFileSync(path, css)
    assertions(run(path))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test("the app's own palette clears the floor on every checked pair", () => {
  const result = run(appStylesheet)

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /all >= APCA Lc 60/)
})

test("reproduces the APCA-W3 reference pairs, so the inlined math is the real thing", () => {
  const black = { "--color-text": "#000", "--color-bg": "#fff" }
  const white = { "--color-text-dim": "#fff", "--color-bg-raised": "#000" }

  withStylesheet(stylesheet({ ...black, ...white }), (result) => {
    // #000 on #fff is Lc 106.04 and #fff on #000 is Lc -107.88 in the APCA-W3 reference table
    assert.match(result.output, /--color-text\s+on\s+--color-bg\s+Lc\s+106\.0\b/)
    assert.match(result.output, /--color-text-dim\s+on\s+--color-bg-raised\s+Lc\s+-107\.9\b/)
  })
})

test("rejects the pre-APCA dim text, and names the token and the surfaces it fails on", () => {
  withStylesheet(stylesheet({ "--color-text-dim": "oklch(0.705 0.032 267.093)" }), (result) => {
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /3 of 11 pair\(s\)/)
    assert.match(result.output, /--color-text-dim on --color-bg-card is Lc -49\.1/)
    // the pairs it does not fail still print, because the margins are the point
    assert.match(result.output, /--color-danger\s+on\s+--color-bg\s+Lc\s+-6\d\.\d\s+ok/)
  })
})

test("rejects the white-on-danger the alerts badge used to wear, before --color-danger-fill", () => {
  // the badge was `background: var(--danger)` at --danger's pre-APCA L 0.735, which read Lc 54
  withStylesheet(stylesheet({ "--color-danger-fill": "oklch(0.735 0.163 21.864)" }), (result) => {
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /--color-text-inverse on --color-danger-fill is Lc -54\.\d/)
  })
})

test("composites a color-mix state tint rather than reading it as opaque", () => {
  // 12% danger over bg-card is nearly bg-card, so danger on it barely differs from danger on the
  // card itself; read as opaque it would be danger on danger, which is Lc 0.
  withStylesheet(stylesheet(), (result) => {
    assert.equal(result.status, 0, result.output)
    assert.match(result.output, /--color-danger\s+on\s+--state-error-bg on card\s+Lc\s+-60\.\d\s+ok/)
  })
})

test("says which token is missing rather than throwing a colour-parse error", () => {
  const css = stylesheet().replace(/ {2}--color-danger-fill:[^\n]*\n/, "")

  withStylesheet(css, (result) => {
    assert.notEqual(result.status, 0, result.output)
    assert.match(result.output, /--color-danger-fill is not declared/)
  })
})
