import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const pluginRoot = dirname(require.resolve('@jimp/plugin-print/package.json'))
const sourceRoot = join(pluginRoot, 'dist', 'fonts', 'open-sans')
const destination = resolve('fonts')
const fontDirectories = [
  'open-sans-64-white',
  'open-sans-64-black',
  'open-sans-32-white',
  'open-sans-32-black',
]

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })

for (const fontDirectory of fontDirectories) {
  const source = join(sourceRoot, fontDirectory)
  for (const entry of await readdir(source)) {
    await cp(join(source, entry), join(destination, entry))
  }
}
