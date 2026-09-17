/**
 * Stage everything the og pipeline reads off disk into the lambda zip: the two brand faces
 * (woff, one file per weight and unicode subset) and resvg's wasm module. `src/og/fonts.ts` and
 * `src/og/render.ts` look for exactly these paths under `LAMBDA_TASK_ROOT`.
 */
import { cp, mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fontManifest } from '../src/og/fonts.ts'

const require = createRequire(import.meta.url)

const fonts = resolve('fonts')
await rm(fonts, { recursive: true, force: true })
await mkdir(fonts, { recursive: true })
for (const { pkg, file } of fontManifest()) {
  await cp(require.resolve(`${pkg}/files/${file}`), join(fonts, file))
}

const vendor = resolve('vendor')
await rm(vendor, { recursive: true, force: true })
await mkdir(vendor, { recursive: true })
await cp(require.resolve('@resvg/resvg-wasm/index_bg.wasm'), join(vendor, 'resvg.wasm'))

console.log(`staged ${fontManifest().length} font files in fonts/ and resvg.wasm in vendor/`)
