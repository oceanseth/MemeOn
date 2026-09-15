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

/**
 * A stylesheet shaped like `src/index.css`: an `@theme static` block of Soft Press `light-dark()`
 * tokens (the shipped values, so the fixture passes on its own) and a base-layer `:root`. A
 * comment quoting `:root` sits ahead of the real block on purpose.
 */
const stylesheet = (overrides = {}) => {
  const ramps = {
    "--ramp-bubblegum-200": "oklch(84% 0.1 345)",
    "--ramp-bubblegum-300": "oklch(76% 0.164 345)",
    "--ramp-bubblegum-700": "oklch(48% 0.184 345)",
    "--ramp-bubblegum-800": "oklch(37% 0.142 345)",
    "--ramp-ultraviolet-100": "oklch(91% 0.041 285)",
    "--ramp-ultraviolet-200": "oklch(84% 0.074 285)",
    "--ramp-ultraviolet-300": "oklch(76% 0.115 285)",
    "--ramp-ultraviolet-700": "oklch(48% 0.252 285)",
    "--ramp-ultraviolet-800": "oklch(37% 0.195 285)",
    "--ramp-ultraviolet-900": "oklch(28% 0.147 285)",
    "--tier-prismatic-chip-end": "light-dark(var(--ramp-ultraviolet-200), var(--ramp-ultraviolet-700))",
  }
  const tokens = {
    "--color-background": "light-dark(oklch(97.5% 0.008 285), oklch(17% 0.022 285))",
    "--color-foreground": "light-dark(oklch(22% 0.035 285), oklch(95% 0.01 285))",
    "--color-card": "light-dark(oklch(99.5% 0.002 285), oklch(23% 0.027 285))",
    "--color-accent": "light-dark(oklch(98.5% 0.006 285), oklch(27% 0.03 285))",
    "--color-muted": "light-dark(oklch(92.5% 0.016 285), oklch(13.5% 0.018 285))",
    "--color-muted-foreground": "light-dark(oklch(45% 0.03 285), oklch(79% 0.03 285))",
    "--color-border": "light-dark(oklch(86% 0.02 285), oklch(40% 0.04 285))",
    "--color-link": "light-dark(var(--ramp-ultraviolet-700), var(--ramp-ultraviolet-200))",
    "--color-primary": "light-dark(oklch(80% 0.131 345), oklch(80% 0.107 235))",
    "--color-primary-foreground": "oklch(22% 0.035 285)",
    "--color-brand": "oklch(80% 0.094 285)",
    "--color-brand-foreground": "oklch(22% 0.035 285)",
    "--color-success": "light-dark(oklch(93% 0.07 150), oklch(29% 0.07 150))",
    "--color-success-foreground": "light-dark(oklch(36% 0.094 150), oklch(85% 0.12 150))",
    "--color-warning": "light-dark(oklch(94% 0.061 85), oklch(30% 0.059 82))",
    "--color-warning-foreground": "light-dark(oklch(40% 0.082 70), oklch(87% 0.12 85))",
    "--color-error": "light-dark(oklch(94% 0.029 20), oklch(29% 0.075 25))",
    "--color-error-foreground": "light-dark(oklch(43% 0.15 25), oklch(84% 0.084 25))",
    "--color-info": "light-dark(oklch(93% 0.04 230), oklch(28% 0.05 235))",
    "--color-info-foreground": "light-dark(oklch(40% 0.087 240), oklch(85% 0.08 235))",
    "--color-destructive": "var(--color-error-foreground)",
    "--color-destructive-foreground": "light-dark(oklch(97.5% 0.008 285), oklch(22% 0.035 285))",
    "--color-braincell": "light-dark(var(--ramp-bubblegum-700), var(--ramp-bubblegum-200))",
    "--color-tier-paper-chip": "var(--color-muted)",
    "--color-tier-paper-chip-text": "var(--color-muted-foreground)",
    "--color-tier-silver-chip": "var(--color-border)",
    "--color-tier-silver-chip-text": "var(--color-foreground)",
    "--color-tier-holo-chip": "light-dark(var(--ramp-ultraviolet-200), var(--ramp-ultraviolet-800))",
    "--color-tier-holo-chip-text": "light-dark(var(--ramp-ultraviolet-900), var(--ramp-ultraviolet-100))",
    "--color-tier-chrome-chip": "var(--color-foreground)",
    "--color-tier-chrome-chip-text": "var(--color-background)",
    "--color-tier-gold-chip": "var(--color-warning)",
    "--color-tier-gold-chip-text": "var(--color-warning-foreground)",
    "--color-tier-prismatic-chip": "light-dark(var(--ramp-bubblegum-200), var(--ramp-bubblegum-800))",
    "--color-tier-prismatic-chip-text": "var(--color-foreground)",
    "--color-tier-shiny-chip": "var(--color-primary)",
    "--color-tier-shiny-chip-text": "var(--color-primary-foreground)",
    ...overrides,
  }
  const declare = (entries, indent) => entries.map(([k, v]) => `${indent}${k}: ${v};`).join("\n")
  return (
    `/* prose that mentions :root { } before the real block */\n` +
    `@theme static {\n${declare(Object.entries(tokens), "  ")}\n}\n\n@layer base {\n  :root {\n` +
    `${declare(Object.entries(ramps), "    ")}\n` +
    "    color-scheme: light dark;\n  }\n\n  :root[data-theme='dark'] {\n    color-scheme: dark;\n  }\n}\n"
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

test("the app's own palette clears the floor on every checked pair in both arms", () => {
  const result = run(appStylesheet)

  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /across light and dark, all >= APCA Lc 60/)
  assert.match(result.output, /--color-foreground\s+on\s+--color-background\s+light\s+Lc/)
  assert.match(result.output, /--color-foreground\s+on\s+--color-background\s+dark\s+Lc/)
})

test("reproduces the APCA-W3 reference pairs, so the inlined math is the real thing", () => {
  const black = { "--color-foreground": "#000", "--color-background": "#fff" }
  const white = { "--color-muted-foreground": "#fff", "--color-card": "#000" }

  withStylesheet(stylesheet({ ...black, ...white }), (result) => {
    // #000 on #fff is Lc 106.04 and #fff on #000 is Lc -107.88 in the APCA-W3 reference table;
    // a plain literal is the same colour in both arms
    assert.match(result.output, /--color-foreground\s+on\s+--color-background\s+light\s+Lc\s+106\.0\b/)
    assert.match(result.output, /--color-foreground\s+on\s+--color-background\s+dark\s+Lc\s+106\.0\b/)
    assert.match(result.output, /--color-muted-foreground\s+on\s+--color-card\s+light\s+Lc\s+-107\.9\b/)
  })
})

test("checks each arm of a light-dark() pair on its own and names the arm that fails", () => {
  // the light arm is the shipped muted ink; the dark arm is too dim for the dark canvases
  const dim = { "--color-muted-foreground": "light-dark(oklch(45% 0.03 285), oklch(60% 0.03 285))" }

  withStylesheet(stylesheet(dim), (result) => {
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /--color-muted-foreground on --color-background \(dark\) is Lc -\d+\.\d/)
    assert.match(result.output, /--color-muted-foreground on --color-accent \(dark\) is Lc -\d+\.\d/)
    // the light arm of the same token still passes, and still prints
    assert.match(result.output, /--color-muted-foreground\s+on\s+--color-background\s+light\s+Lc\s+\d+\.\d\s+ok/)
    // Paper's chip label is the same muted ink on the pressed surface, so it fails with it
    assert.match(result.output, /--color-tier-paper-chip-text on --color-tier-paper-chip \(dark\) is Lc/)
    assert.doesNotMatch(result.output, /\(light\) is Lc/)
  })
})

test("follows var() into a light-dark() and lands on a different arm value each side", () => {
  withStylesheet(stylesheet(), (result) => {
    assert.equal(result.status, 0, result.output)
    const light = result.output.match(/--color-link\s+on\s+--color-background\s+light\s+Lc\s+(-?\d+\.\d)/)
    const dark = result.output.match(/--color-link\s+on\s+--color-background\s+dark\s+Lc\s+(-?\d+\.\d)/)
    assert.ok(light && dark, result.output)
    assert.ok(parseFloat(light[1]) > 0, "light link is dark text on a light canvas")
    assert.ok(parseFloat(dark[1]) < 0, "dark link is light text on a dark canvas")
  })
})

test("says which token is missing rather than throwing a colour-parse error", () => {
  const css = stylesheet().replace(/ {2}--color-tier-gold-chip-text:[^\n]*\n/, "")

  withStylesheet(css, (result) => {
    assert.notEqual(result.status, 0, result.output)
    assert.match(result.output, /--color-tier-gold-chip-text is not declared/)
  })
})
