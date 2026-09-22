import assert from 'node:assert/strict'
import test from 'node:test'
import { hasQuotedText } from './masky'

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
