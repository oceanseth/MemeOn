import assert from 'node:assert/strict'
import test from 'node:test'
import { Jimp } from 'jimp'
import {
  composeCollectibleOgCard,
  loadOgFrameBundle,
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

test('collectible card keeps a wide source complete inside the portrait aperture', async () => {
  const art = new Jimp({ width: 400, height: 100, color: 0x00aa44ff })
  for (let y = 0; y < 100; y += 1) {
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

  assert.equal(card.bitmap.width, MEME_OG_WIDTH)
  assert.equal(card.bitmap.height, MEME_OG_HEIGHT)
  assert.equal(card.getPixelColor(10, 10), 0xff00ffff, 'frame overlay stays above the card')

  const sourceCenterY = 600
  const left = rgba(card.getPixelColor(145, sourceCenterY))
  const right = rgba(card.getPixelColor(778, sourceCenterY))
  assert.ok(left.r > 180 && left.b < 80, 'left edge of the source remains visible')
  assert.ok(right.b > 180 && right.r < 100, 'right edge of the source remains visible')
  assert.equal(card.getPixelColor(480, sourceCenterY), 0x00aa44ff, 'foreground stays unmodified')

  assert.equal(
    card.getPixelColor(manifest.aperture.x, manifest.aperture.y),
    0x0b0d14ff,
    'the blurred matte is clipped to the rounded aperture',
  )
  const matte = rgba(card.getPixelColor(480, 180))
  assert.ok(
    matte.g > 50 && matte.g < 90,
    'the web-strength matte stays visible without going bright',
  )
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
  assert.equal(card.getPixelColor(480, 600), 0xffffffff)
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
