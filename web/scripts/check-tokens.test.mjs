import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'

const checker = resolve(import.meta.dirname, 'check-tokens.mjs')

const withTree = (css, files, run) => {
  const root = mkdtempSync(join(tmpdir(), 'memeon-token-check-'))
  const src = join(root, 'src')
  const indexCss = join(src, 'index.css')
  try {
    mkdirSync(src, { recursive: true })
    writeFileSync(indexCss, css)
    for (const [path, contents] of Object.entries(files)) {
      const file = join(src, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, indexCss, src], {
      encoding: 'utf8',
    })
    return run({ status: result.status, output: result.stdout + result.stderr })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const theme = (...lines) =>
  `@theme static {\n  --color-*: initial;\n${lines.map((line) => `  ${line}`).join('\n')}\n}\n`

test('passes when every token is painted by a utility or a var()', () => {
  withTree(
    theme(
      '--color-primary: oklch(0.7 0.1 340);',
      '--radius-lg: 24px;',
      '--container-card-narrow: 220px;',
    ),
    {
      'atoms/button.tsx': 'export const B = () => <button className="bg-primary rounded-lg" />\n',
      'atoms/card.tsx': 'export const C = () => <div className="@max-card-narrow:flex-wrap" />\n',
      'lib/cn.ts':
        "export const cn = createCn({ extend: { theme: { container: ['card-narrow'] } } })\n",
    },
    ({ status, output }) => {
      assert.equal(status, 0, output)
      assert.match(output, /3 token\(s\)/)
    },
  )
})

test('fails on a token nothing reaches', () => {
  withTree(
    theme('--color-primary: oklch(0.7 0.1 340);', '--color-ghost: oklch(0.5 0 0);'),
    {
      'atoms/button.tsx': 'export const B = () => <button className="bg-primary" />\n',
      'lib/cn.ts': 'export const cn = createCn({ extend: { theme: {} } })\n',
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /--color-ghost/)
      assert.doesNotMatch(output, /--color-primary\n/)
    },
  )
})

test('fails when cn.ts registers a namespace value @theme no longer declares', () => {
  withTree(
    theme('--color-primary: oklch(0.7 0.1 340);', '--container-card-narrow: 220px;'),
    {
      'atoms/button.tsx':
        'export const B = () => <button className="bg-primary max-w-card-narrow" />\n',
      'lib/cn.ts':
        "export const cn = createCn({ extend: { theme: { container: ['card-narrow', 'search'] } } })\n",
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /cn\.ts registers container: search/)
    },
  )
})

test('exits 2 when the stylesheet does not exist', () => {
  const root = mkdtempSync(join(tmpdir(), 'memeon-token-check-absent-'))
  const missing = join(root, 'index.css')
  rmSync(root, { recursive: true, force: true })
  const result = spawnSync(process.execPath, [checker, missing, root], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 2, result.stdout + result.stderr)
  assert.match(result.stderr, /does not exist/)
})
