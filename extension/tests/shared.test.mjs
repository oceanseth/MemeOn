import assert from 'node:assert/strict'
import { test } from 'node:test'
import '../shared.js'
const { imageUrl, profile, boundedBlob, MAX_BYTES, dataUrl } = globalThis.MemeOn

test('accepts DOM image sources and rejects executable URLs and embedded credentials', () => {
  assert.equal(imageUrl('/image.png', 'https://example.org/page'), 'https://example.org/image.png')
  assert.equal(imageUrl('data:image/png;base64,eA=='), 'data:image/png;base64,eA==')
  assert.equal(imageUrl('blob:https://example.org/id'), 'blob:https://example.org/id')
  for (const source of [
    'javascript:alert(1)',
    'file:///secret',
    'data:text/html,hello',
    'https://user:secret@example.org/a',
    '',
    null,
  ])
    assert.equal(imageUrl(source), null)
})
test('public profile strips tokens and dangerous avatar URLs', () => {
  assert.deepEqual(
    profile({
      sub: 'u',
      name: 'Name',
      picture: 'javascript:alert(1)',
      sessionToken: 'secret',
      coins: 500,
    }),
    { sub: 'u', name: 'Name', picture: null },
  )
  assert.equal(profile({ sub: '' }), null)
  assert.equal(
    profile({ sub: 'u', picture: 'https://cdn.example/avatar.png' }).picture,
    'https://cdn.example/avatar.png',
  )
})
test('bounded image download handles bytes, HTTP failures, and both declared and streamed oversize bodies', async () => {
  const image = await boundedBlob(
    new Response('hello', { headers: { 'content-type': 'image/png; charset=binary' } }),
  )
  assert.equal(image.type, 'image/png')
  assert.equal(await dataUrl(image), 'data:image/png;base64,aGVsbG8=')
  await assert.rejects(boundedBlob(new Response('', { status: 403 })), /did not allow/)
  await assert.rejects(
    boundedBlob(new Response('x', { headers: { 'content-length': String(MAX_BYTES + 1) } })),
    /8 MB/,
  )
  let cancelled = false
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_BYTES + 1))
    },
    cancel() {
      cancelled = true
    },
  })
  await assert.rejects(boundedBlob(new Response(stream)), /8 MB/)
  assert.equal(cancelled, true)
  await assert.rejects(boundedBlob(new Response('')), /empty/)
})
