import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const script = resolve(import.meta.dirname, "shadcn-postadd.mjs")
const liveSrc = resolve(import.meta.dirname, "..", "src")
/** Same pattern as shadcn-postadd.mjs — do not import the CLI (it has no exports). */
const CN_IMPORT = /(\bfrom\s*)(['"])cn\2/g
/** Stock shadcn CLI import. Not rewritten by postadd; live-tree ratchet only. */
const LUCIDE_IMPORT = /\bfrom\s*(['"])lucide-react\1/g

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
})

const withSrc = (files, run) => {
  const src = mkdtempSync(join(tmpdir(), "memeon-shadcn-postadd-"))
  try {
    for (const [path, contents] of Object.entries(files)) {
      const file = join(src, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [script, src], { encoding: "utf8" })
    const output = result.stdout + result.stderr
    return run({
      status: result.status,
      output,
      read: (path) => readFileSync(join(src, path), "utf8"),
    })
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
}

test("rewrites from \"cn\" and from 'cn' keeping the same quote around @/lib/cn", () => {
  withSrc(
    {
      "double.tsx": 'import { cn } from "cn"\nexport const x = cn("a")\n',
      "single.tsx": "import { cn } from 'cn'\nexport const x = cn('a')\n",
    },
    ({ status, output, read }) => {
      assert.equal(status, 0, output)
      assert.equal(read("double.tsx"), 'import { cn } from "@/lib/cn"\nexport const x = cn("a")\n')
      assert.equal(read("single.tsx"), "import { cn } from '@/lib/cn'\nexport const x = cn('a')\n")
      assert.match(output, /double\.tsx/)
      assert.match(output, /single\.tsx/)
      assert.match(output, /2 file\(s\) rewritten/)
    },
  )
})

test("leaves from 'cn/config', from '@/lib/cn', and from '../lib/cn' unchanged", () => {
  withSrc(
    {
      "config.tsx": "import { createCn } from 'cn/config'\n",
      "alias.tsx": 'import { cn } from "@/lib/cn"\n',
      "relative.tsx": "import { cn } from '../lib/cn'\n",
    },
    ({ status, output, read }) => {
      assert.equal(status, 0, output)
      assert.equal(read("config.tsx"), "import { createCn } from 'cn/config'\n")
      assert.equal(read("alias.tsx"), 'import { cn } from "@/lib/cn"\n')
      assert.equal(read("relative.tsx"), "import { cn } from '../lib/cn'\n")
      assert.match(output, /0 file\(s\) rewritten/)
    },
  )
})

test("LUCIDE_IMPORT matches from \"lucide-react\" and from 'lucide-react' only", () => {
  const hits = (source) => [...source.matchAll(LUCIDE_IMPORT)].length
  assert.equal(hits('import { Check } from "lucide-react"\n'), 1)
  assert.equal(hits("import { Check } from 'lucide-react'\n"), 1)
  assert.equal(hits("import { Check } from 'lucide-react/foo'\n"), 0)
  assert.equal(hits("import { Icon } from '@/atoms/icon'\n"), 0)
  assert.equal(hits("lucide glyph\n"), 0)
})

// Read-only walk of the real tree. Never spawn the mutator against live src/.
test("live src/ has no from \"cn\" / from 'cn' (cn/config must not match)", () => {
  const hits = []
  for (const file of walk(liveSrc).filter((name) => /\.(ts|tsx)$/.test(name))) {
    const source = readFileSync(file, "utf8")
    if ([...source.matchAll(CN_IMPORT)].length) hits.push(relative(liveSrc, file))
  }
  assert.equal(hits.length, 0, `stock from "cn" in ${hits.join(", ")}`)
  assert.match(readFileSync(join(liveSrc, "lib", "cn.ts"), "utf8"), /from ['"]cn\/config['"]/)
})

// Read-only walk of the real tree. Never spawn the mutator against live src/.
test("live src/ has no from \"lucide-react\" / from 'lucide-react'", () => {
  const hits = []
  for (const file of walk(liveSrc).filter((name) => /\.(ts|tsx)$/.test(name))) {
    const source = readFileSync(file, "utf8")
    if ([...source.matchAll(LUCIDE_IMPORT)].length) hits.push(relative(liveSrc, file))
  }
  assert.equal(hits.length, 0, `from "lucide-react" in ${hits.join(", ")}`)
})

const repoRoot = resolve(import.meta.dirname, "..", "..")
const LUCIDE_PACKAGES = ["lucide", "lucide-react", "lucide-static"]
const WORKSPACE_MANIFESTS = ["package.json", "web/package.json", "api/package.json", "mobile/package.json", "shared/package.json"]
const DEP_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]

test("pnpm-workspace.yaml overrides lucide-react to - so it is never installed", () => {
  const yaml = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8")
  assert.match(yaml, /^overrides:\n(?:[ \t]+.+\n)*[ \t]+lucide-react:\s*'-'/m)
})

test("workspace package.json files do not declare lucide packages", () => {
  const hits = []
  for (const rel of WORKSPACE_MANIFESTS) {
    const pkg = JSON.parse(readFileSync(join(repoRoot, rel), "utf8"))
    for (const field of DEP_FIELDS) {
      const bag = pkg[field]
      if (!bag) continue
      for (const name of LUCIDE_PACKAGES) {
        if (name in bag) hits.push(`${rel} ${field}.${name}`)
      }
    }
  }
  assert.equal(hits.length, 0, hits.join(", "))
})

test("pnpm-lock.yaml has no installed lucide package snapshot", () => {
  const lock = readFileSync(join(repoRoot, "pnpm-lock.yaml"), "utf8")
  const snapshots = [...lock.matchAll(/^ {2}(lucide(?:-react|-static)?)@/gm)].map((match) => match[1])
  assert.equal(snapshots.length, 0, `lockfile snapshots: ${snapshots.join(", ")}`)
})

test("node_modules does not contain a lucide-react install", () => {
  const hits = []
  const roots = [repoRoot, join(repoRoot, "web"), join(repoRoot, "api"), join(repoRoot, "mobile"), join(repoRoot, "shared")]
  for (const root of roots) {
    for (const name of LUCIDE_PACKAGES) {
      const direct = join(root, "node_modules", name, "package.json")
      if (existsSync(direct)) hits.push(relative(repoRoot, direct))
    }
    const pnpmStore = join(root, "node_modules", ".pnpm")
    if (!existsSync(pnpmStore)) continue
    for (const entry of readdirSync(pnpmStore)) {
      if (LUCIDE_PACKAGES.some((name) => entry === name || entry.startsWith(`${name}@`))) {
        hits.push(relative(repoRoot, join(pnpmStore, entry)))
      }
    }
  }
  assert.equal(hits.length, 0, hits.join(", "))
})
