import assert from 'node:assert/strict'
import test from 'node:test'
import { Jimp } from 'jimp'
import {
  collectibleCardGeometry,
  composeCollectibleOgCard,
  loadOgFrameBundle,
  loadOgFrameManifest,
  MEME_OG_HEIGHT,
  MEME_OG_WIDTH,
  validateOgFrameManifest,
} from './ogCard'
import { testOgFrameManifest as manifest } from './og.fixtures'

function rgba(value: number) {
  return {
    r: (value >>> 24) & 0xff,
    g: (value >>> 16) & 0xff,
    b: (value >>> 8) & 0xff,
    a: value & 0xff,
  }
}

test('the card takes a landscape source ratio and the art fills the aperture edge to edge', async () => {
  const art = new Jimp({ width: 400, height: 200, color: 0x00aa44ff })
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x < 50; x += 1) art.setPixelColor(0xff2200ff, x, y)
    for (let x = 350; x < 400; x += 1) art.setPixelColor(0x2255ffff, x, y)
  }
  const frame = new Jimp({ width: 960, height: 1200, color: 0x00000000 })
  frame.setPixelColor(0xff00ffff, 10, 10)

  const output = await composeCollectibleOgCard({
    art: await art.getBuffer('image/png'),
    frame: await frame.getBuffer('image/png'),
    manifest,
  })
  const card = await Jimp.read(output)

  const geometry = collectibleCardGeometry(manifest, 400, 200)
  assert.equal(card.bitmap.width, geometry.width)
  assert.equal(card.bitmap.height, geometry.height)
  assert.ok(geometry.width > geometry.height, 'a 2:1 source yields a landscape card')
  assert.equal(card.getPixelColor(10, 10), 0xff00ffff, 'frame overlay stays above the card')

  const aperture = geometry.aperture
  const centerY = aperture.y + Math.round(aperture.height / 2)
  const left = rgba(card.getPixelColor(aperture.x + 8, centerY))
  const right = rgba(card.getPixelColor(aperture.x + aperture.width - 9, centerY))
  assert.ok(left.r > 180 && left.b < 80, 'left edge of the source reaches the aperture edge')
  assert.ok(right.b > 180 && right.r < 100, 'right edge of the source reaches the aperture edge')
  assert.equal(
    card.getPixelColor(aperture.x + Math.round(aperture.width / 2), centerY),
    0x00aa44ff,
    'foreground stays unmodified',
  )

  assert.equal(
    card.getPixelColor(aperture.x, aperture.y),
    0x0b0d14ff,
    'the art is clipped to the rounded aperture',
  )
})

test('a source past the ratio clamp center-crops inside a clamped card', async () => {
  const art = new Jimp({ width: 400, height: 100, color: 0x00aa44ff })
  for (let y = 0; y < 100; y += 1) {
    for (let x = 0; x < 50; x += 1) art.setPixelColor(0xff2200ff, x, y)
  }
  const frame = new Jimp({ width: 960, height: 1200, color: 0x00000000 })
  const output = await composeCollectibleOgCard({
    art: await art.getBuffer('image/png'),
    frame: await frame.getBuffer('image/png'),
    manifest,
  })
  const card = await Jimp.read(output)
  const clamped = collectibleCardGeometry(manifest, 400, 100)
  assert.deepEqual(
    { width: card.bitmap.width, height: card.bitmap.height },
    { width: clamped.width, height: clamped.height },
  )
  assert.deepEqual(clamped, collectibleCardGeometry(manifest, 800, 100), 'ratio clamps at 2:1')
  const aperture = clamped.aperture
  assert.equal(
    card.getPixelColor(
      aperture.x + Math.round(aperture.width / 2),
      aperture.y + Math.round(aperture.height / 2),
    ),
    0x00aa44ff,
    'the center of the source survives the crop',
  )
})

test('a classic portrait source reproduces the master 960x1200 card', async () => {
  const bundledManifest = await loadOgFrameManifest()
  const geometry = collectibleCardGeometry(
    bundledManifest,
    bundledManifest.aperture.width,
    bundledManifest.aperture.height,
  )
  assert.equal(geometry.width, MEME_OG_WIDTH)
  assert.equal(geometry.height, MEME_OG_HEIGHT)
  assert.deepEqual(geometry.aperture, bundledManifest.aperture)
})

test('video cards render an unmistakable play badge inside the frame', async () => {
  const art = new Jimp({ width: 400, height: 300, color: 0x234567ff })
  const frame = new Jimp({ width: 960, height: 1200, color: 0x00000000 })
  const output = await composeCollectibleOgCard({
    art: await art.getBuffer('image/png'),
    frame: await frame.getBuffer('image/png'),
    manifest,
    mediaType: 'video',
  })
  const card = await Jimp.read(output)
  const { aperture } = collectibleCardGeometry(manifest, 400, 300)
  assert.equal(
    card.getPixelColor(
      aperture.x + Math.round(aperture.width / 2),
      aperture.y + Math.round(aperture.height / 2),
    ),
    0xffffffff,
  )
})

test('bundled frame resolution works outside the repository cwd and unknown tiers use paper', async () => {
  const originalCwd = process.cwd()
  try {
    process.chdir('/')
    const bundle = await loadOgFrameBundle('not-a-real-tier')
    assert.equal(bundle.tierKey, 'paper')
    const frame = await Jimp.read(bundle.frame)
    assert.equal(frame.bitmap.width, MEME_OG_WIDTH)
    assert.equal(frame.bitmap.height, MEME_OG_HEIGHT)
  } finally {
    process.chdir(originalCwd)
  }
})

test('manifest validation rejects geometry that could silently crop outside the aperture', () => {
  assert.throws(
    () =>
      validateOgFrameManifest({
        ...manifest,
        sourceSafeRect: { x: 20, y: 20, width: 900, height: 1100 },
      }),
    /sourceSafeRect outside aperture/,
  )
})

test('unsupported source bytes fail instead of emitting an old-style fallback card', async () => {
  const frame = new Jimp({ width: 960, height: 1200, color: 0x00000000 })
  await assert.rejects(
    composeCollectibleOgCard({
      art: Buffer.from('not an image'),
      frame: await frame.getBuffer('image/png'),
      manifest,
    }),
  )
})
