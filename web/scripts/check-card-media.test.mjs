import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { runChecker } from './lib/checker-fixture.mjs'

const checker = resolve(import.meta.dirname, 'check-card-media.mjs')

const CARD_MEDIA = [
  "const ViewportObserver = typeof IntersectionObserver === 'undefined' ? null : IntersectionObserver",
  'let cardObserver = null',
  'export function applyCardVisibility(card, visible) {',
  "  if (visible) card.style.removeProperty('--glow-play-state')",
  "  else card.style.setProperty('--glow-play-state', 'paused')",
  '  cardObserver ??= new ViewportObserver(() => {})',
  '}',
  '',
].join('\n')

const MARKET = "const observer = new IntersectionObserver(() => {}, { rootMargin: '900px' })\n"

const CARD = [
  'export function MemeCard({ model }) {',
  '  return (',
  '    <article ref={model.cardRef}>',
  '      <video />',
  '    </article>',
  '  )',
  '}',
  '',
].join('\n')

const LEGAL = {
  'lib/cardMedia.ts': CARD_MEDIA,
  'hooks/useMarketplaceCatalog.ts': MARKET,
  'molecules/meme-card.tsx': CARD,
}

const withSrc = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), 'memeon-card-media-check-'))
  const src = join(root, 'src')
  try {
    const { status, output } = runChecker(checker, src, files)
    return run({ status, output, src })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('passes when IO, glow mutation and the card handles stay on their owners', () => {
  withSrc(LEGAL, ({ status, output }) => {
    assert.equal(status, 0, output)
    assert.match(output, /lib\/cardMedia\.ts/)
    assert.match(output, /molecules\/meme-card\.tsx delegates/)
  })
})

test('skips tests and stories that mock IntersectionObserver', () => {
  withSrc(
    {
      ...LEGAL,
      'lib/cardMedia.runtime.test.tsx':
        'class Fake implements IntersectionObserver { observe() { new IntersectionObserver(() => {}) } }\n',
      'molecules/meme-card.stories.tsx':
        'export const Video = { play: () => new IntersectionObserver(() => {}) }\n',
      'hooks/market-regressions.runtime.test.tsx':
        "vi.stubGlobal('IntersectionObserver', class {})\n",
    },
    ({ status, output }) => {
      assert.equal(status, 0, output)
    },
  )
})

test('fails when IntersectionObserver leaves cardMedia and the marketplace sentinel', () => {
  withSrc(
    {
      ...LEGAL,
      'hooks/useBinderScreen.ts': 'const observer: IntersectionObserver | null = null\n',
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /hooks\/useBinderScreen\.ts:1/)
      assert.match(output, /IntersectionObserver identifier/)
    },
  )
})

test('fails when cardMedia constructs IntersectionObserver instead of ViewportObserver', () => {
  withSrc(
    {
      ...LEGAL,
      'lib/cardMedia.ts': CARD_MEDIA.replace(
        'new ViewportObserver(() => {})',
        'new IntersectionObserver(() => {})',
      ),
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /lib\/cardMedia\.ts:/)
      assert.match(output, /new IntersectionObserver/)
      assert.match(output, /ViewportObserver alias/)
    },
  )
})

test('fails when cardMedia line-breaks new IntersectionObserver', () => {
  withSrc(
    {
      ...LEGAL,
      'lib/cardMedia.ts': CARD_MEDIA.replace(
        'new ViewportObserver(() => {})',
        'new\n    IntersectionObserver(() => {})',
      ),
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /lib\/cardMedia\.ts/)
      assert.match(output, /new IntersectionObserver/)
      assert.match(output, /ViewportObserver alias/)
    },
  )
})

test('fails when --glow-play-state mutation leaves lib/cardMedia.ts', () => {
  withSrc(
    {
      ...LEGAL,
      'atoms/foil.ts':
        "export const pause = (el) => el.style.setProperty('--glow-play-state', 'paused')\n",
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /atoms\/foil\.ts:1/)
      assert.match(output, /--glow-play-state/)
    },
  )
})

test('fails when a multiline setProperty of --glow-play-state leaves lib/cardMedia.ts', () => {
  withSrc(
    {
      ...LEGAL,
      'atoms/foil.ts': [
        'export const pause = (el) =>',
        '  el.style.setProperty(',
        "    '--glow-play-state',",
        "    'paused'",
        '  )',
        '',
      ].join('\n'),
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /atoms\/foil\.ts/)
      assert.match(output, /--glow-play-state/)
    },
  )
})

test('fails when a meme-card component mentions IntersectionObserver or drops the model handles', () => {
  withSrc(
    {
      ...LEGAL,
      'molecules/meme-card.tsx':
        'export function MemeCard() { new IntersectionObserver(() => {}); return <article /> }\n',
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /molecules\/meme-card\.tsx/)
      assert.match(output, /does not construct an observer/)
      assert.match(output, /missing ref=\{model\.cardRef\}/)
    },
  )
})

test('fails when a meme-card only mentions ref={model.cardRef} in a comment', () => {
  withSrc(
    {
      ...LEGAL,
      'molecules/meme-card.tsx': [
        'export function MemeCard({ model }) {',
        '  // ref={model.cardRef}',
        '  return <article>{model}</article>',
        '}',
        '',
      ].join('\n'),
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /missing ref=\{model\.cardRef\}/)
    },
  )
})

test('fails when lib/cardMedia.ts or the meme-card component is missing', () => {
  withSrc(
    {
      'hooks/useMarketplaceCatalog.ts': MARKET,
    },
    ({ status, output }) => {
      assert.equal(status, 1, output)
      assert.match(output, /lib\/cardMedia\.ts is missing/)
      assert.match(output, /no \*meme-card\* component/)
    },
  )
})

test('the real tree keeps card-media ownership', () => {
  const src = resolve(import.meta.dirname, '..', 'src')
  const result = spawnSync(process.execPath, [checker, src], {
    encoding: 'utf8',
  })
  const output = result.stdout + result.stderr
  assert.equal(result.status, 0, output)
  assert.match(output, /molecules\/meme-card\.tsx delegates/)
})
