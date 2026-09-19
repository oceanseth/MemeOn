import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-copy.mjs")

const withSrc = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "memeon-copy-check-"))
  const src = join(root, "src")
  const baseline = join(root, "copy-baseline.json")
  try {
    for (const [path, contents] of Object.entries(files)) {
      const file = join(src, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const check = (...flags) => {
      const result = spawnSync(process.execPath, [checker, src, `--baseline=${baseline}`, ...flags], { encoding: "utf8" })
      return { status: result.status, output: result.stdout + result.stderr }
    }
    return run({ check, baseline, src })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const hook = [
  "import { settingsCopy } from '../copy/settings'",
  "import type { Tier } from '../lib/types'",
  "export const build = (name: string, tier: Tier, n: number) => ({",
  "  title: 'Settings',",                                   // Capitalised word
  "  intro: 'Make yourself at home.',",                     // sentence
  "  name: `Hello ${name}`,",                               // template with a word
  "  mark: `🧠 ${name}`,",                                  // emoji + slot: no words, not counted
  "  count: `${n} of 100 shown`,",                          // template, words around a slot
  "  hyphenated: 'Tier-ups',",                              // Capitalised hyphenated word
  "  fromCopy: settingsCopy.title,",                        // not a literal
  "  key: 'discord',",                                      // lowercase key
  "  path: '/api/memes',",                                  // path
  "  url: `/api/memes/${tier}/stats`,",                     // path template
  "  href: 'https://memeon.ai/binder',",                    // URL
  "  css: `var(--color-tier-${tier}-frame)`,",              // CSS
  "  media: '(prefers-reduced-motion: reduce)',",           // media query
  "  className: 'CreationLifetimeCancelledError',",         // CamelCase identifier
  "  phase: 'loading' as Tier,",                            // type-ish
  "  error: new Error('login failed'),",                    // developer message
  "  log: console.warn('render took too long'),",           // developer message
  "  'Object Key With Spaces': 1,",                         // property name
  "})",
  "",
].join("\n")

test("counts copy-like literals and ignores keys, paths, css, types and developer messages", () => {
  withSrc({
    "hooks/useSettingsScreen.ts": hook,
    "hooks/useSettingsScreen.test.ts": "const x = 'Never counted: tests are out of scope'\n",
    "lib/tradeCardModel.ts": "export const label = 'You give'\n",
    "lib/createMemeModel/shared.ts": "export const hint = 'try a shorter clip'\n",
    "lib/api.ts": "export const message = 'Out of scope: not a model builder'\n",
    "copy/settings.ts": "export const settingsCopy = { title: 'Settings' } as const\n",
    "lib/types.ts": "export type Tier = 'fresh' | 'shiny'\n",
  }, ({ check, baseline }) => {
    const first = check()
    assert.equal(first.status, 1, first.output)
    assert.match(first.output, /no baseline/)

    const written = check("--update")
    assert.equal(written.status, 0, written.output)
    assert.deepEqual(JSON.parse(readFileSync(baseline, "utf8")), {
      "hooks/useSettingsScreen.ts": 5,
      "lib/tradeCardModel.ts": 1,
      "lib/createMemeModel/shared.ts": 1,
    })

    const again = check()
    assert.equal(again.status, 0, again.output)
    assert.match(again.output, /7 copy-like literal\(s\) outside copy\/, at baseline/)
  })
})

test("fails when a file grows past its baseline and refuses to raise the baseline", () => {
  withSrc({
    "hooks/useSettingsScreen.ts": "export const a = 'Settings'\nexport const b = 'Log out'\n",
    "hooks/useNewScreen.ts": "export const c = 'Brand new copy'\n",
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "hooks/useSettingsScreen.ts": 1 }))

    const result = check()
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /hooks\/useSettingsScreen\.ts: 1 → 2/)
    assert.match(result.output, /hooks\/useNewScreen\.ts: 0 → 1/)
    assert.match(result.output, /move the string into copy\//)

    const forced = check("--update")
    assert.equal(forced.status, 1, forced.output)
    assert.deepEqual(JSON.parse(readFileSync(baseline, "utf8")), { "hooks/useSettingsScreen.ts": 1 })
  })
})

test("fails when a file drops below its baseline until --update locks the drop in", () => {
  withSrc({
    "hooks/useSettingsScreen.ts": "export const a = 'Settings'\n",
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "hooks/useSettingsScreen.ts": 3, "hooks/useGoneScreen.ts": 2 }))

    const result = check()
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /hooks\/useSettingsScreen\.ts: 3 → 1/)
    assert.match(result.output, /hooks\/useGoneScreen\.ts: 2 → 0/)
    assert.match(result.output, /--update/)

    const lowered = check("--update")
    assert.equal(lowered.status, 0, lowered.output)
    assert.deepEqual(JSON.parse(readFileSync(baseline, "utf8")), { "hooks/useSettingsScreen.ts": 1 })
    assert.ok(existsSync(baseline))
    assert.equal(check().status, 0)
  })
})

test("counts copy-like literals in screens/ and requires --update when a screen drops", () => {
  withSrc({
    "screens/TradeScreen.tsx": "export const title = 'Trade'\nexport const intro = 'Build a fair deal.'\n",
    "hooks/useTradeScreen.ts": "export const a = 'Settings'\n",
  }, ({ check, baseline, src }) => {
    writeFileSync(baseline, JSON.stringify({ "hooks/useTradeScreen.ts": 1, "screens/TradeScreen.tsx": 2 }))
    writeFileSync(join(src, "screens/TradeScreen.tsx"), "export const title = 'Trade'\n")

    const result = check()
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /screens\/TradeScreen\.tsx: 2 → 1/)

    const lowered = check("--update")
    assert.equal(lowered.status, 0, lowered.output)
    assert.deepEqual(JSON.parse(readFileSync(baseline, "utf8")), {
      "hooks/useTradeScreen.ts": 1,
      "screens/TradeScreen.tsx": 1,
    })
  })
})

test("does not count class lists: className, a merge call, or a string that reads as Tailwind", () => {
  withSrc({
    "screens/LayoutScreen.tsx": [
      "import { cn } from '../lib/cn'",
      "export const title = 'Trade desk'",
      "const ROW = 'mt-1 flex flex-wrap items-baseline gap-x-4'",
      "const PLATE = cn('flex flex-col gap-3.5', 'lg:docked lg:-mx-5', 'max-lg:data-[collapsed=true]:hidden')",
      "export const Screen = () => (",
      "  <div className=\"grid list-none gap-5 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]\">",
      "    <p className={cn(ROW, PLATE)}>{title}</p>",
      "  </div>",
      ")",
    ].join("\n"),
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "screens/LayoutScreen.tsx": 1 }))

    // only the title counts; every class list is skipped by position or by shape
    assert.equal(check().status, 0, check().output)
  })
})

test("counts copy-like JsxText in screens/", () => {
  withSrc({
    "screens/LandingScreen.tsx": "export const Screen = () => <h1>Memes are the new trading cards</h1>\n",
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({}))

    const result = check()
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /screens\/LandingScreen\.tsx: 0 → 1/)
    assert.match(result.output, /move the string into copy\//)

    const listed = check("--list")
    assert.match(listed.output, /Memes are the new trading cards/)
  })
})

test("ignores trivia-only JsxText and still counts a quoted copy literal", () => {
  withSrc({
    "screens/SettingsScreen.tsx": [
      "export const label = 'Settings'",
      "export const Screen = () => (",
      "  <div>",
      "    <span />",
      "  </div>",
      ")",
    ].join("\n"),
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "screens/SettingsScreen.tsx": 1 }))
    assert.equal(check().status, 0, check().output)
  })
})

test("does not count copy/ even for JsxText", () => {
  withSrc({
    "copy/x.tsx": "export const Screen = () => <h1>Memes are the new trading cards</h1>\n",
    "hooks/useSettingsScreen.ts": "export const a = 'Settings'\n",
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "hooks/useSettingsScreen.ts": 1 }))
    assert.equal(check().status, 0, check().output)
    const listed = check("--list")
    assert.doesNotMatch(listed.output, /copy\/x\.tsx/)
    assert.doesNotMatch(listed.output, /Memes are the new trading cards/)
  })
})

test("refuses to raise the baseline when JsxText would grow a file", () => {
  withSrc({
    "screens/LandingScreen.tsx": "export const Screen = () => <h1>Memes are the new trading cards</h1>\n",
  }, ({ check, baseline }) => {
    writeFileSync(baseline, JSON.stringify({ "screens/LandingScreen.tsx": 0 }))

    const forced = check("--update")
    assert.equal(forced.status, 1, forced.output)
    assert.match(forced.output, /screens\/LandingScreen\.tsx: 0 → 1/)
    assert.deepEqual(JSON.parse(readFileSync(baseline, "utf8")), { "screens/LandingScreen.tsx": 0 })
  })
})
