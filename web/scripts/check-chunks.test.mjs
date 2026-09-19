import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-chunks.mjs")

const map = (sources) => JSON.stringify({ version: 3, file: "index.js", sources, mappings: "" })

const LEGAL_SRC = {
  "src/screens/LandingScreen.tsx": [
    "import { FoilCard } from '@/atoms/foil-frame'",
    "// import { MemeCard } from '@/molecules/meme-card'",
    "export function LandingScreen() { return <FoilCard /> }",
    "",
  ].join("\n"),
  "src/screens/CreateMemeScreen.tsx": [
    "export function CreateMemeScreen() {",
    '  return <div data-slot="meme-card" />',
    "}",
    "",
  ].join("\n"),
  "src/lib/createMemeModel/shared.ts": "export const x = 1\n",
}

const ENTRY_SOURCES = [
  "../../src/main.tsx",
  "../../src/views/AppView.tsx",
  "../../src/views/LandingView.tsx",
  "../../src/molecules/meme-card.tsx",
  "../../src/lib/memeCardModel.ts",
  "../../src/lib/cardMedia.ts",
  "../../../node_modules/react-router-dom/dist/index.js",
]

const LEGAL = {
  "dist/assets/index-abc.js.map": map(ENTRY_SOURCES),
  "dist/assets/CreateMemeView-xyz.js.map": map([
    "../../src/views/CreateMemeView.tsx",
    "../../src/screens/CreateMemeScreen.tsx",
  ]),
  ...LEGAL_SRC,
}

const runChecker = (files) => {
  const root = mkdtempSync(join(tmpdir(), "memeon-chunk-check-"))
  try {
    for (const [path, contents] of Object.entries(files)) {
      const file = join(root, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, join(root, "dist")], { encoding: "utf8" })
    return { status: result.status, output: result.stdout + result.stderr }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test("passes when mint stays lazy, Landing stays eager, and the entry already has meme-card", () => {
  const result = runChecker(LEGAL)

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /entry keeps LandingView\.tsx/)
  assert.match(result.output, /do not import meme-card/)
})

test("fails when a lazy view appears in the entry source map", () => {
  const result = runChecker({
    ...LEGAL,
    "dist/assets/index-abc.js.map": map([...ENTRY_SOURCES, "../../src/views/CreateMemeView.tsx"]),
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /lazy view CreateMemeView\.tsx is in the entry/)
  assert.match(result.output, /keep it behind lazy\(\) in AppView\.tsx/)
})

test("fails when a future CreateMeme*View mint split lands in the entry", () => {
  const result = runChecker({
    ...LEGAL,
    "dist/assets/index-abc.js.map": map([...ENTRY_SOURCES, "../../src/views/CreateMemePromptView.tsx"]),
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /lazy view CreateMemePromptView\.tsx is in the entry/)
})

test("fails when CreateMemeScreen imports meme-card", () => {
  const result = runChecker({
    ...LEGAL,
    "src/screens/CreateMemeScreen.tsx": [
      "import { MemeCard } from '@/molecules/meme-card'",
      "export function CreateMemeScreen() { return <MemeCard /> }",
      "",
    ].join("\n"),
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /CreateMemeScreen\.tsx:1/)
  assert.match(result.output, /imports meme-card via "@\/molecules\/meme-card"/)
})

test("fails when LandingView is missing from the entry", () => {
  const result = runChecker({
    ...LEGAL,
    "dist/assets/index-abc.js.map": map(ENTRY_SOURCES.filter((source) => !source.endsWith("LandingView.tsx"))),
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /LandingView\.tsx is missing from the entry/)
})

test("does not treat a data-slot or a commented import as a meme-card module import", () => {
  const result = runChecker({
    ...LEGAL,
    "src/lib/createMemeModel/shared.ts": [
      "/* import { MemeCard } from '@/organisms/meme-card' */",
      "export const x = 1",
      "",
    ].join("\n"),
  })

  assert.equal(result.status, 0, result.output)
})

test("exits 2 when there is nothing built to check", () => {
  const missing = spawnSync(process.execPath, [checker, join(tmpdir(), "memeon-chunk-check-absent")], {
    encoding: "utf8",
  })

  assert.equal(missing.status, 2, missing.stdout + missing.stderr)
  assert.match(missing.stderr, /does not exist — run the build first/)

  const empty = runChecker({
    "dist/assets/.keep": "",
    ...LEGAL_SRC,
  })
  assert.equal(empty.status, 2, empty.output)
  assert.match(empty.output, /no JavaScript source maps/)
})
