import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const WEB = resolve(import.meta.dirname, '..')
const oxlint = join(WEB, 'node_modules', '.bin', 'oxlint')

/** Lints one file through the real `.oxlintrc.json`, so the rule is tested as it is configured. */
const lint = (name, source, run) => {
  const dir = mkdtempSync(join(tmpdir(), 'memeon-lint-'))
  try {
    writeFileSync(join(dir, name), source)
    const result = spawnSync(oxlint, ['--config', '.oxlintrc.json', dir], {
      cwd: WEB,
      encoding: 'utf8',
    })
    return run({ status: result.status, output: result.stdout + result.stderr })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('flags a chrome input type written in JSX', () => {
  lint('Mint.tsx', 'export const S = () => <Input type="file" />\n', ({ status, output }) => {
    assert.equal(status, 1, output)
    assert.match(output, /no-native-chrome/)
    assert.match(output, /atoms\/file-drop/)
  })
})

/* The one that actually shipped: `type` set in a prop bag a builder returns and the screen
   spreads, which nothing that only walks JSX can see. */
test('flags a chrome input type set in a prop bag and spread', () => {
  lint(
    'buildUploadModeModel.ts',
    "export const build = () => ({ imageFileInputProps: { type: 'file', accept: 'image/png' } })\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /type="file"/)
    },
  )
})

test('flags a user-agent element', () => {
  lint(
    'Picker.tsx',
    'export const S = () => <select><option value="a" /></select>\n',
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /<select> is painted by the user agent/)
      assert.match(output, /<option>/)
    },
  )
})

test('flags a user-agent dialog, on the global or bare', () => {
  lint(
    'leave.ts',
    "export const a = () => window.confirm('sure?')\nexport const b = () => alert('hi')\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /window\.confirm\(\)/)
      assert.match(output, /alert\(\)/)
    },
  )
})

test('leaves a locally bound confirm alone', () => {
  lint(
    'leave.ts',
    "const confirm = (q: string) => q.length > 0\nexport const b = () => confirm('sure?')\n",
    ({ status, output }) => assert.equal(status, 0, output),
  )
})

test('leaves the controls we draw ourselves alone', () => {
  lint(
    'Mint.tsx',
    'export const S = () => <FileDrop accept="image/png" chooseLabel={copy.choose} />\n',
    ({ status, output }) => assert.equal(status, 0, output),
  )
})

test('src/atoms/file-drop.tsx keeps its scoped exception and the rest of src stays clean', () => {
  const result = spawnSync(oxlint, ['--config', '.oxlintrc.json', 'src'], {
    cwd: WEB,
    encoding: 'utf8',
  })
  const output = result.stdout + result.stderr
  assert.equal(result.status, 0, output)
  assert.doesNotMatch(output, /no-native-chrome/)
  assert.doesNotMatch(output, /no-use-effect/)
})

test('flags a useEffect call', () => {
  lint(
    'Sync.tsx',
    "import { useState } from 'react'\nexport const S = () => { useEffect(() => {}, []) }\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /no-use-effect/)
      assert.match(output, /useMountEffect/)
    },
  )
})

test('flags importing useEffect from react', () => {
  lint(
    'sync.ts',
    "import { useEffect } from 'react'\nexport const n = 1\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /no-use-effect/)
      assert.match(output, /import/)
    },
  )
})

test('flags an aliased useEffect import', () => {
  lint(
    'sync.ts',
    "import { useEffect as onMount } from 'react'\nexport const go = () => onMount(() => {})\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /no-use-effect/)
    },
  )
})

test('flags React.useEffect and a computed access', () => {
  lint(
    'sync.ts',
    "import React from 'react'\nexport const go = () => { React.useEffect(() => {}); React['useEffect'](() => {}) }\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /no-use-effect/)
    },
  )
})

test('flags useLayoutEffect', () => {
  lint(
    'sync.ts',
    "import { useLayoutEffect } from 'react'\nexport const go = () => useLayoutEffect(() => {})\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /useLayoutEffect/)
    },
  )
})

test('flags destructuring useEffect off React', () => {
  lint(
    'sync.ts',
    "import React from 'react'\nconst { useEffect } = React\nexport const go = () => useEffect(() => {})\n",
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /no-use-effect/)
    },
  )
})

test('leaves a useMountEffect call alone', () => {
  lint(
    'sync.ts',
    "import { useMountEffect } from './useMountEffect'\nexport const go = () => useMountEffect(() => {})\n",
    ({ status, output }) => assert.equal(status, 0, output),
  )
})
