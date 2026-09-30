import assert from 'node:assert/strict'
import test from 'node:test'
import { imageSizeFromBuffer } from './imageSize'

/** Minimal valid PNG head: signature + IHDR chunk carrying the given dimensions. */
function pngFixture(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0)
  buf.writeUInt32BE(13, 8) // IHDR length
  buf.write('IHDR', 12, 'latin1')
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  return buf
}

/** GIF89a logical screen descriptor. */
function gifFixture(width: number, height: number): Buffer {
  const buf = Buffer.alloc(13)
  buf.write('GIF89a', 0, 'latin1')
  buf.writeUInt16LE(width, 6)
  buf.writeUInt16LE(height, 8)
  return buf
}

/** SOI, an APP0 segment, then a SOF marker carrying the frame dimensions. */
function jpegFixture(width: number, height: number, sofMarker = 0xc0): Buffer {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)])
  const sof = Buffer.alloc(12)
  sof[0] = 0xff
  sof[1] = sofMarker
  sof.writeUInt16BE(10, 2) // segment length
  sof[4] = 8 // precision
  sof.writeUInt16BE(height, 5)
  sof.writeUInt16BE(width, 7)
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof])
}

test('png header yields its IHDR dimensions', () => {
  assert.deepEqual(imageSizeFromBuffer(pngFixture(480, 270)), { width: 480, height: 270 })
})

test('gif header yields its logical screen dimensions', () => {
  assert.deepEqual(imageSizeFromBuffer(gifFixture(320, 568)), { width: 320, height: 568 })
})

test('jpeg baseline SOF0 yields the frame dimensions', () => {
  assert.deepEqual(imageSizeFromBuffer(jpegFixture(1200, 630)), { width: 1200, height: 630 })
})

test('jpeg progressive SOF2 yields the frame dimensions', () => {
  assert.deepEqual(imageSizeFromBuffer(jpegFixture(640, 640, 0xc2)), { width: 640, height: 640 })
})

test('jpeg DHT (C4) is skipped, not read as a frame header', () => {
  const dht = Buffer.from([0xff, 0xc4, 0x00, 0x04, 0x00, 0x00])
  const fixture = Buffer.concat([Buffer.from([0xff, 0xd8]), dht, jpegFixture(99, 44).subarray(2)])
  assert.deepEqual(imageSizeFromBuffer(fixture), { width: 99, height: 44 })
})

test('truncated png (cut before IHDR data) yields null', () => {
  assert.equal(imageSizeFromBuffer(pngFixture(480, 270).subarray(0, 18)), null)
})

test('truncated jpeg (cut before any SOF) yields null', () => {
  assert.equal(imageSizeFromBuffer(jpegFixture(1200, 630).subarray(0, 6)), null)
})

test('garbage input yields null', () => {
  assert.equal(imageSizeFromBuffer(Buffer.from('not an image, sorry')), null)
  assert.equal(imageSizeFromBuffer(Buffer.alloc(0)), null)
})

test('zero dimensions are rejected', () => {
  assert.equal(imageSizeFromBuffer(gifFixture(0, 100)), null)
  assert.equal(imageSizeFromBuffer(pngFixture(100, 0)), null)
})
