import assert from 'node:assert/strict'
import test from 'node:test'
import { editImage, hasQuotedText, normalizeVideoStatus, videoStatus } from './masky'

test('hasQuotedText: straight double quotes with content', () => {
  assert.equal(hasQuotedText('a sign that says "FREE HUGS" in a park'), true)
})

test('hasQuotedText: curly quotes with content', () => {
  assert.equal(hasQuotedText('a shirt reading “TEXT ON SHIRT”'), true)
})

test('hasQuotedText: no quotes', () => {
  assert.equal(hasQuotedText('a capybara in a business suit, cinematic'), false)
})

test('hasQuotedText: empty or whitespace-only quotes do not count', () => {
  assert.equal(hasQuotedText('empty "" quotes'), false)
  assert.equal(hasQuotedText('blank "   " quotes'), false)
})

test('hasQuotedText: a lone unpaired quote does not count', () => {
  assert.equal(hasQuotedText('a 5" figurine on a shelf'), false)
})

test("hasQuotedText: apostrophes and single quotes don't count", () => {
  assert.equal(hasQuotedText("it's 3am and everything is on 'fire'"), false)
})

test('editImage: model rides in the body only when given', async (t) => {
  const bodies: Array<Record<string, unknown>> = []
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return new Response(JSON.stringify({ imageUrl: 'https://x/img.png' }), { status: 200 })
  })
  await editImage('tok', 'the sign says "yes more please"', ['https://x/src.png'], 'qwen')
  await editImage('tok', 'make it rain', ['https://x/src.png'])
  assert.equal(bodies[0].model, 'qwen')
  assert.equal('model' in bodies[1], false)
})

test("normalizeVideoStatus: Masky's finished render reads as the clip the web poll waits for", () => {
  assert.deepEqual(
    normalizeVideoStatus({ status: 'ready', videoUrl: 'https://x/v.mp4', slug: 's' }),
    {
      status: 'video',
      videoUrl: 'https://x/v.mp4',
    },
  )
  assert.deepEqual(normalizeVideoStatus({ status: 'video', videoUrl: 'https://x/v.mp4' }), {
    status: 'video',
    videoUrl: 'https://x/v.mp4',
  })
})

test('normalizeVideoStatus: a failure carries its reason under either name', () => {
  assert.deepEqual(normalizeVideoStatus({ status: 'error', error: 'Video generation failed' }), {
    status: 'error',
    errorMessage: 'Video generation failed',
  })
  assert.deepEqual(normalizeVideoStatus({ status: 'error', errorMessage: 'old shape' }), {
    status: 'error',
    errorMessage: 'old shape',
  })
})

test('normalizeVideoStatus: anything unfinished keeps the poll going', () => {
  assert.equal(normalizeVideoStatus({ status: 'queued', videoUrl: null }).status, 'queued')
  assert.equal(normalizeVideoStatus({ status: 'rendering' }).status, 'rendering')
  assert.equal(normalizeVideoStatus({ status: 'ready', videoUrl: null }).status, 'rendering')
  assert.equal(normalizeVideoStatus({}).status, 'rendering')
})

test('videoStatus: normalizes what Masky answers', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ status: 'ready', videoUrl: 'https://x/v.mp4' }), {
        status: 200,
      }),
  )
  assert.deepEqual(await videoStatus('tok', 'gen-1'), {
    status: 'video',
    videoUrl: 'https://x/v.mp4',
  })
})
