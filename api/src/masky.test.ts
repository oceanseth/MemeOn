import assert from 'node:assert/strict'
import test from 'node:test'
import { editImage, hasQuotedText } from './masky'

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
