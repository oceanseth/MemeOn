import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-docs.mjs")

/**
 * A miniature repo: a root package.json, a web workspace with one token sheet, one atom and one
 * story, and whatever documents the case wants. The checker runs against it exactly as it runs
 * against this repo, so a rule that fires here fires there.
 */
const TREE = {
  "package.json": JSON.stringify({ name: "memeon", packageManager: "pnpm@11.25.0", scripts: { check: "turbo run check" } }),
  "web/package.json": JSON.stringify({ name: "web", scripts: { "lint:ds": "oxlint src", "check-docs": "node scripts/check-docs.mjs" } }),
  "web/src/index.css": [
    "@theme static {",
    "  --color-primary: light-dark(oklch(80% 0.131 345), oklch(80% 0.107 235));",
    "  --radius-lg: 24px;",
    "}",
    "@utility focus-ring {",
    "  outline: 3px solid var(--color-primary);",
    "}",
  ].join("\n"),
  "web/src/atoms/button.tsx": "export function Button() {\n  return <button className=\"bg-primary rounded-lg focus-ring\" />\n}\n",
  "web/src/atoms/button.stories.tsx": "export const Default = {}\n",
  "web/scripts/docs-allowlist.json": JSON.stringify({ allow: [] }),
}

const withRepo = (documents, run) => {
  const root = mkdtempSync(join(tmpdir(), "memeon-docs-check-"))
  try {
    for (const [path, contents] of Object.entries({ ...TREE, ...documents })) {
      const file = join(root, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, root], { encoding: "utf8" })
    return run({ status: result.status, output: result.stdout + result.stderr })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test("passes when every name a document writes exists", () => {
  withRepo(
    {
      "README.md": [
        "The button is `web/src/atoms/button.tsx`; it paints `bg-primary` and `rounded-lg` over `focus-ring`.",
        "Tokens are `--color-primary` and `--radius-lg`. `Button` is the export.",
        "Gate: `pnpm --filter web run lint:ds`, then `pnpm run check`.",
      ].join("\n"),
      "web/src/Anatomy.mdx": "One atom: `Button`, in `atoms/button.tsx`, with a sibling `button.stories.tsx`.\n",
    },
    ({ status, output }) => {
      assert.equal(status, 0, output)
      assert.match(output, /2 document\(s\) checked/)
    },
  )
})

// A case-only difference (`Button.tsx` beside `button.tsx`) is invisible on APFS, so the dead path
// a test asserts on has to differ by more than case — as the real documents' names do.
test("fails on a dead path", () => {
  withRepo({ "README.md": "The notice is `web/src/atoms/notice.tsx`.\n" }, ({ status, output }) => {
    assert.equal(status, 1, output)
    assert.match(output, /README\.md:1 {2}path `web\/src\/atoms\/notice\.tsx` does not exist/)
  })
})

test("fails on a dead markdown link", () => {
  withRepo({ "README.md": "See [the anatomy](web/src/Anatomy.mdx).\n" }, ({ status, output }) => {
    assert.equal(status, 1, output)
    assert.match(output, /link target `web\/src\/Anatomy\.mdx` does not exist/)
  })
})

test("fails on an undeclared token and an undeclared class", () => {
  withRepo(
    { "README.md": "Surfaces are `--color-canvas`, painted with `bg-canvas` and `rounded-card`.\n" },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /token `--color-canvas` is declared nowhere/)
      assert.match(output, /class `bg-canvas` names no `--color-canvas` token/)
      assert.match(output, /class `rounded-card` names no `--radius-card` token/)
    },
  )
})

test("accepts a declared token, a stock class and an @utility", () => {
  withRepo(
    { "README.md": "`--color-primary` paints `bg-primary`, `rounded-lg`, `rounded-full`, `focus-ring`.\n" },
    ({ status, output }) => assert.equal(status, 0, output),
  )
})

test("fails on a component no tier file exports", () => {
  withRepo(
    {
      "README.md": "The notice is `atoms/Notice`.\n",
      "web/src/Anatomy.mdx": "Atoms: `Button`, `Notice`.\n",
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /component `Notice` is exported by no file in src\/atoms\|molecules\|organisms/)
      assert.match(output, /`Notice` is declared nowhere in web\/src/)
    },
  )
})

test("fails on a script the workspace does not have, and on npm in a pnpm repo", () => {
  withRepo(
    { "README.md": "Run `pnpm --filter web run check-tokens`, or `npm run build`.\n" },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /`pnpm --filter web run check-tokens` is not a script in web\/package\.json/)
      assert.match(output, /`npm run build` — this workspace is pnpm/)
    },
  )
})

test("a document that is not in the checkout is skipped, not failed", () => {
  withRepo({}, ({ status, output }) => {
    assert.equal(status, 0, output)
    assert.match(output, /0 document\(s\) checked/)
  })
})

test("the allowlist excuses a name, but only in the document it is scoped to", () => {
  const allow = JSON.stringify({
    allow: [{ name: "web/src/atoms/notice.tsx", file: "docs/HISTORY.md", why: "The atom this archive names was deleted with its last consumer." }],
  })
  withRepo(
    { "web/scripts/docs-allowlist.json": allow, "docs/HISTORY.md": "It was `web/src/atoms/notice.tsx`.\n" },
    ({ status, output }) => assert.equal(status, 0, output),
  )
  withRepo(
    { "web/scripts/docs-allowlist.json": allow, "README.md": "It is `web/src/atoms/notice.tsx`.\n" },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /README\.md:1 {2}path `web\/src\/atoms\/notice\.tsx` does not exist/)
    },
  )
})

// The CI bug this rule exists for: `AGENTS.md` links to `docs/*.md`, `scripts/bd` and
// `.codex/config.toml`, all of which live in `.git/info/exclude` — so a fresh clone has no `docs/`
// at all. A head that resolves nowhere on the way out to the repo root is not a claim this
// checkout can check; a head that does resolve is checked all the way down.
test("a path into a tree this checkout does not carry is not a claim", () => {
  const doc = "See [the runbook](docs/RUNBOOK.md) and `scripts/bd`.\n"
  withRepo({ "AGENTS.md": doc }, ({ status, output }) => assert.equal(status, 0, output))
  withRepo({ "AGENTS.md": doc, "docs/OTHER.md": "x\n", "scripts/other.sh": "x\n" }, ({ status, output }) => {
    assert.equal(status, 1, output)
    assert.match(output, /link target `docs\/RUNBOOK\.md` does not exist/)
    assert.match(output, /path `scripts\/bd` does not exist/)
  })
})

test("a relative path resolves from the document outward", () => {
  withRepo(
    { "web/src/Anatomy.mdx": "`atoms/button.tsx` · `scripts/docs-allowlist.json` · `web/src/index.css`\n" },
    ({ status, output }) => assert.equal(status, 0, output),
  )
})

test("an allowlist entry without a reason is itself an error", () => {
  withRepo(
    { "web/scripts/docs-allowlist.json": JSON.stringify({ allow: [{ name: "anything" }] }) },
    ({ status, output }) => {
      assert.equal(status, 2, output)
      assert.match(output, /needs a `name` and a `why`/)
    },
  )
})

test("finishes well inside its budget", () => {
  const started = Date.now()
  const result = spawnSync(process.execPath, [checker], { encoding: "utf8" })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.ok(Date.now() - started < 2000, `check-docs took ${Date.now() - started}ms on the real tree`)
})
