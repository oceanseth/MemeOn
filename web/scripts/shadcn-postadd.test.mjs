import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const script = resolve(import.meta.dirname, "shadcn-postadd.mjs")
const liveSrc = resolve(import.meta.dirname, "..", "src")
/** Same pattern as shadcn-postadd.mjs — do not import the CLI (it has no exports). */
const CN_IMPORT = /(\bfrom\s*)(['"])cn\2/g

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
