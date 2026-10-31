import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const origin = process.argv.includes('--dev') ? 'https://dev.memeon.ai' : 'https://memeon.ai'
const out = resolve(root, 'dist', process.argv.includes('--dev') ? 'dev' : 'production')
await mkdir(out, { recursive: true })
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'))
if (process.argv.includes('--dev')) manifest.name = 'MemeOn! (Dev)'
for (const name of [
  'shared.js',
  'pending.js',
  'background.js',
  'content.js',
  'bridge.js',
  'icons',
  'README.md',
])
  await cp(resolve(root, name), resolve(out, name), { recursive: true })
await writeFile(resolve(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(resolve(out, 'config.js'), `globalThis.MEMEON_ORIGIN = ${JSON.stringify(origin)}\n`)
console.log(`Load unpacked: ${out}`)
