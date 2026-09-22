import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webDir = path.resolve(scriptDir, '..')
const repoDir = path.resolve(webDir, '..')
const outputDir = path.join(repoDir, 'api/assets/og-frames')
const temporaryHtml = path.join(webDir, '.og-frame-export.html')
const requireFromApi = createRequire(path.join(repoDir, 'api/package.json'))
const { Jimp } = requireFromApi('jimp')

const TIERS = ['paper', 'silver', 'holo', 'chrome', 'gold', 'prismatic', 'shiny']
const CSS_STAGE = { width: 480, height: 600 }
const DEVICE_SCALE_FACTOR = 2
const EXPECTED_FRAME = { x: 60, y: 75, width: 840, height: 1050 }
const EXPECTED_APERTURE = { x: 98, y: 113, width: 740, height: 974, radius: 28 }
const EXPECTED_SAFE_RECT = { x: 114, y: 129, width: 708, height: 942 }

const roundScaled = (value) => Math.round(value * DEVICE_SCALE_FACTOR)
const scaledRect = (rect) => ({
  x: roundScaled(rect.x),
  y: roundScaled(rect.y),
  width: roundScaled(rect.width),
  height: roundScaled(rect.height),
})

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} changed: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`)
  }
}

function insideRoundedRect(x, y, rect) {
  const localX = x + 0.5 - rect.x
  const localY = y + 0.5 - rect.y
  if (localX < 0 || localY < 0 || localX >= rect.width || localY >= rect.height) return false
  const radius = rect.radius
  const nearestX = Math.max(radius, Math.min(localX, rect.width - radius))
  const nearestY = Math.max(radius, Math.min(localY, rect.height - radius))
  const dx = localX - nearestX
  const dy = localY - nearestY
  return dx * dx + dy * dy <= radius * radius
}

async function punchAperture(filePath, aperture) {
  const image = await Jimp.read(filePath)
  // Headless Chromium can vary an antialiased edge channel by one value between otherwise
  // identical runs. Snap channels to a 64-step grid before writing so generated assets are stable.
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_x, _y, index) => {
    for (let channel = 0; channel < 4; channel += 1) {
      const value = image.bitmap.data[index + channel]
      image.bitmap.data[index + channel] = Math.min(255, Math.round(value / 4) * 4)
    }
  })
  image.scan(aperture.x, aperture.y, aperture.width, aperture.height, (x, y, index) => {
    if (insideRoundedRect(x, y, aperture)) image.bitmap.data[index + 3] = 0
  })
  await image.write(filePath)
  return image
}

async function hashFile(filePath) {
  const bytes = await readFile(filePath)
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

await mkdir(outputDir, { recursive: true })
await writeFile(
  temporaryHtml,
  '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module" src="/scripts/og-frame-export.tsx"></script></body></html>',
)

let server
let browser
try {
  server = await createServer({
    root: webDir,
    configFile: path.join(webDir, 'vite.config.ts'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  })
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string') throw new Error('Vite did not expose a local port')
  const baseUrl = `http://127.0.0.1:${address.port}/.og-frame-export.html`

  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: CSS_STAGE,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })

  let geometry
  const fileMeta = {}
  const tierFiles = {}

  for (const tier of TIERS) {
    const page = await context.newPage()
    await page.goto(`${baseUrl}?tier=${tier}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.documentElement.dataset.exportReady === 'true')

    const measured = await page.evaluate(() => {
      const stage = document.querySelector('[data-slot="og-export-stage"]')
      const frame = document.querySelector('[data-slot="foil-media"]')
      const backing = document.querySelector('[data-slot="collectible-backing"]')
      const aperture = document.querySelector('[data-slot="collectible-window"]')
      if (!stage || !frame || !backing || !aperture)
        throw new Error('Export geometry is incomplete')
      const stageRect = stage.getBoundingClientRect()
      const relative = (element) => {
        const rect = element.getBoundingClientRect()
        return {
          x: rect.x - stageRect.x,
          y: rect.y - stageRect.y,
          width: rect.width,
          height: rect.height,
        }
      }
      const apertureStyle = getComputedStyle(aperture)
      const border = Number.parseFloat(apertureStyle.borderLeftWidth)
      const outerRadius = Number.parseFloat(apertureStyle.borderTopLeftRadius)
      const apertureOuter = relative(aperture)
      return {
        frame: relative(frame),
        backing: relative(backing),
        aperture: {
          x: apertureOuter.x + border,
          y: apertureOuter.y + border,
          width: apertureOuter.width - border * 2,
          height: apertureOuter.height - border * 2,
          radius: Math.max(0, outerRadius - border),
        },
      }
    })

    const tierGeometry = {
      frame: scaledRect(measured.frame),
      backing: { ...scaledRect(measured.backing), radius: 48 },
      aperture: {
        ...scaledRect(measured.aperture),
        radius: roundScaled(measured.aperture.radius),
      },
    }
    tierGeometry.sourceSafeRect = {
      x: tierGeometry.aperture.x + 16,
      y: tierGeometry.aperture.y + 16,
      width: tierGeometry.aperture.width - 32,
      height: tierGeometry.aperture.height - 32,
    }

    assertEqual(tierGeometry.frame, EXPECTED_FRAME, `${tier} frame`)
    assertEqual(tierGeometry.aperture, EXPECTED_APERTURE, `${tier} aperture`)
    assertEqual(tierGeometry.sourceSafeRect, EXPECTED_SAFE_RECT, `${tier} source safe rect`)
    geometry ??= tierGeometry
    assertEqual(tierGeometry, geometry, `${tier} geometry`)

    const fileName = `${tier}.png`
    const filePath = path.join(outputDir, fileName)
    await page.screenshot({ path: filePath, omitBackground: true })
    const image = await punchAperture(filePath, tierGeometry.aperture)
    if (image.bitmap.width !== 960 || image.bitmap.height !== 1200) {
      throw new Error(`${tier} exported at ${image.bitmap.width}x${image.bitmap.height}`)
    }
    const apertureCenter = image.getPixelColor(
      tierGeometry.aperture.x + Math.floor(tierGeometry.aperture.width / 2),
      tierGeometry.aperture.y + Math.floor(tierGeometry.aperture.height / 2),
    )
    if ((apertureCenter & 0xff) !== 0) throw new Error(`${tier} aperture is not transparent`)

    tierFiles[tier] = fileName
    fileMeta[tier] = await hashFile(filePath)
    await page.close()
  }

  const manifest = {
    version: 1,
    units: 'px',
    canvas: {
      width: CSS_STAGE.width * DEVICE_SCALE_FACTOR,
      height: CSS_STAGE.height * DEVICE_SCALE_FACTOR,
      cssWidth: CSS_STAGE.width,
      cssHeight: CSS_STAGE.height,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    },
    frame: geometry.frame,
    backing: geometry.backing,
    aperture: geometry.aperture,
    sourceSafeRect: geometry.sourceSafeRect,
    tiers: tierFiles,
    files: fileMeta,
    render: { theme: 'dark', reducedMotion: true },
  }
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await browser?.close()
  await server?.close()
  await rm(temporaryHtml, { force: true })
}
