import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-chunks.mjs")

const ENTRY_SOURCES = [
  "../../src/main.tsx",
  "../../src/views/AppView.tsx",
  "../../src/views/LandingView.tsx",
  "../../src/molecules/meme-card.tsx",
  "../../src/lib/memeCardModel.ts",
  "../../src/lib/cardMedia.ts",
  "../../node_modules/react-router-dom/dist/index.js",
]

const CLEAN_SRC = {
  "screens/LandingScreen.tsx": [
    "import { Link } from 'react-router-dom'",
    "export function LandingScreen() {",
    "  return <section data-slot='landing'><Link to='/marketplace'>Market</Link></section>",
    "}",
    "",
  ].join("\n"),
  "screens/CreateMemeScreen.tsx": [
    "import type { CreateMemeCardModel } from '../lib/createMemeModel'",
    "import { buildMemeCardModel } from '../lib/memeCardModel'",
    "export function CreateMemeScreen({ model }: { model: CreateMemeCardModel }) {",
    "  return <article data-slot='meme-card'>{buildMemeCardModel ? null : model.title}</article>",
    "}",
    "",
  ].join("\n"),
  "lib/createMemeModel/shared.ts": [
    "import type { CreateMemeCardModel } from './types'",
    "export const preview = (model: CreateMemeCardModel) => model",
    "",
  ].join("\n"),
  "lib/createMemeModel/types.ts": "export type CreateMemeCardModel = { title: string }\n",
}

const writeMap = (file, sources) => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(
    file,
    JSON.stringify({ version: 3, file: file.slice(file.lastIndexOf("/") + 1).replace(/\.map$/, ""), sources, mappings: "" }),
  )
}

const runChecker = ({ maps = {}, src = CLEAN_SRC, distFiles = {} } = {}) => {
  const root = mkdtempSync(join(tmpdir(), "memeon-chunk-check-"))
  const dist = join(root, "dist")
  const srcDir = join(root, "src")
  try {
    mkdirSync(join(dist, "assets"), { recursive: true })
    for (const [name, sources] of Object.entries(maps)) {
      writeMap(join(dist, "assets", name), sources)
    }
    for (const [path, contents] of Object.entries(distFiles)) {
      const file = join(dist, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    for (const [path, contents] of Object.entries(src)) {
      const file = join(srcDir, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, dist, "--src", srcDir], { encoding: "utf8" })
    return { status: result.status, output: result.stdout + result.stderr }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const legalMaps = {
  "index-abc123.js.map": ENTRY_SOURCES,
  "CreateMemeView-def456.js.map": ["../../src/views/CreateMemeView.tsx", "../../src/screens/CreateMemeScreen.tsx"],
  "MarketplaceView-ghi789.js.map": ["../../src/views/MarketplaceView.tsx", "../../src/screens/MarketplaceScreen.tsx"],
}

test("passes when mint stays lazy, Landing stays eager, and the entry already has MemeCard + router", () => {
  const result = runChecker({ maps: legalMaps })

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /index-abc123\.js\.map/)
  assert.match(result.output, /LandingView/)
  assert.match(result.output, /do not import meme-card/)
  assert.doesNotMatch(result.output, /contains lazy view/)
})

test("does not fail because the entry contains meme-card, memeCardModel, cardMedia, or react-router-dom", () => {
  const result = runChecker({ maps: legalMaps })

  assert.equal(result.status, 0, result.output)
  assert.doesNotMatch(result.output, /meme-card\.tsx/)
  assert.doesNotMatch(result.output, /react-router-dom/)
})

test("does not treat data-slot=meme-card, CreateMemeCardModel, or memeCardModel as a meme-card import", () => {
  const result = runChecker({ maps: legalMaps })

  assert.equal(result.status, 0, result.output)
})

test("rejects a lazy view that landed in the entry map", () => {
  const result = runChecker({
    maps: {
      "index-abc123.js.map": [...ENTRY_SOURCES, "../../src/views/MarketplaceView.tsx"],
    },
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /lazy view src\/views\/MarketplaceView\.tsx/)
  assert.match(result.output, /index-abc123\.js\.map/)
})

test("rejects CreateMemeView and a later CreateMeme mode view in the entry", () => {
  const named = runChecker({
    maps: {
      "index-abc123.js.map": [...ENTRY_SOURCES, "../../src/views/CreateMemeView.tsx"],
    },
  })
  const mode = runChecker({
    maps: {
      "index-abc123.js.map": [...ENTRY_SOURCES, "../../src/views/CreateMemeUploadView.tsx"],
    },
  })

  assert.equal(named.status, 1, named.output)
  assert.match(named.output, /lazy view src\/views\/CreateMemeView\.tsx/)
  assert.equal(mode.status, 1, mode.output)
  assert.match(mode.output, /lazy view src\/views\/CreateMemeUploadView\.tsx/)
})

test("rejects an entry that dropped LandingView", () => {
  const result = runChecker({
    maps: {
      "index-abc123.js.map": ENTRY_SOURCES.filter((source) => !source.endsWith("LandingView.tsx")),
    },
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /LandingView\.tsx is missing from the entry/)
})

test("rejects CreateMemeScreen importing a hyphenated meme-card module", () => {
  const result = runChecker({
    maps: legalMaps,
    src: {
      ...CLEAN_SRC,
      "screens/CreateMemeScreen.tsx":
        "import { MemeCard } from '@/molecules/meme-card'\nexport const CreateMemeScreen = () => <MemeCard />\n",
    },
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /screens\/CreateMemeScreen\.tsx imports "\/molecules\/meme-card"|screens\/CreateMemeScreen\.tsx imports "@\/molecules\/meme-card"/)
  assert.match(result.output, /must not import meme-card/)
})

test("rejects LandingScreen or createMemeModel importing meme-card", () => {
  const landing = runChecker({
    maps: legalMaps,
    src: {
      ...CLEAN_SRC,
      "screens/LandingScreen.tsx": "import MemeCard from '../molecules/meme-card.tsx'\nexport const LandingScreen = () => null\n",
    },
  })
  const model = runChecker({
    maps: legalMaps,
    src: {
      ...CLEAN_SRC,
      "lib/createMemeModel/shared.ts": "export { MemeCard } from '../../molecules/meme-card'\n",
    },
  })

  assert.equal(landing.status, 1, landing.output)
  assert.match(landing.output, /screens\/LandingScreen\.tsx/)
  assert.equal(model.status, 1, model.output)
  assert.match(model.output, /lib\/createMemeModel\/shared\.ts/)
})

test("identifies the entry from AppView.tsx when main.tsx is absent", () => {
  const result = runChecker({
    maps: {
      "index-abc123.js.map": ENTRY_SOURCES.filter((source) => !source.endsWith("src/main.tsx")),
      "CreateMemeView-def456.js.map": ["../../src/views/CreateMemeView.tsx"],
    },
  })

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /index-abc123\.js\.map/)
})

test("exits 2 when there is nothing built to check", () => {
  const missing = spawnSync(process.execPath, [checker, join(tmpdir(), "memeon-chunk-check-absent"), "--src", tmpdir()], {
    encoding: "utf8",
  })
  const empty = runChecker({ maps: {}, distFiles: { "assets/.keep": "" } })

  assert.equal(missing.status, 2, missing.stdout + missing.stderr)
  assert.match(missing.stderr, /does not exist — run the build first/)
  assert.equal(empty.status, 2, empty.output)
  assert.match(empty.output, /no JavaScript source maps/)
})
