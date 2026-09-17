/**
 * Render the share cards outside the lambda.
 *
 * `--home` writes the site's own card to `web/public/brand/og-home.png`, the static `og:image`
 * on `index.html` — the site root is served from S3, so that one card is built, not requested.
 * Without a flag it writes a sample of the meme card at every tier into `--out` for eyeballing.
 *
 *   pnpm --filter memeon-api og:home
 *   pnpm --filter memeon-api og:preview -- --out /tmp/og
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TIERS } from '@memeon/shared/tiers'
import { fetchArt } from '../src/og/art'
import { BinderCard, HomeCard, MemeCard, ProfileCard } from '../src/og/cards'
import { renderCard } from '../src/og/render'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

/** Local brand art, inlined the same way `art.ts` inlines remote art. */
async function localArt(relativePath: string): Promise<string | null> {
  try {
    const bytes = await readFile(join(repoRoot, relativePath))
    const type = relativePath.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
    return `data:${type};base64,${bytes.toString('base64')}`
  } catch {
    return null
  }
}

async function renderHome(): Promise<void> {
  const out = join(repoRoot, 'web/public/brand/og-home.png')
  const png = await renderCard(HomeCard({ logo: await localArt('web/public/brand/memeon-logo-circle-256.png') }))
  await writeFile(out, png)
  console.log(`og-home.png · ${(png.length / 1024).toFixed(0)} KB · ${out}`)
}

/**
 * Storybook's dev meme art, so a preview looks like a real share rather than a colour swatch.
 * Read out of the fixture file rather than imported: it lives in the web package's `.storybook`.
 */
async function devMemes(): Promise<{ title: string; imageUrl: string }[]> {
  const source = await readFile(join(repoRoot, 'web/.storybook/dev-meme-media.ts'), 'utf8')
  const found: { title: string; imageUrl: string }[] = []
  const pattern = /"title":\s*"([^"]+)",\s*\n\s*"imageUrl":\s*"([^"]+)"/g
  for (const [, title, imageUrl] of source.matchAll(pattern)) {
    if (!found.some((m) => m.imageUrl === imageUrl)) found.push({ title, imageUrl })
  }
  return found
}

async function renderPreview(): Promise<void> {
  const dir = flag('out') ?? '/tmp/og-preview'
  await mkdir(dir, { recursive: true })
  const logo = await localArt('web/public/brand/memeon-logo-circle-256.png')
  const memes = await devMemes()
  await renderHome()
  for (const [i, tier] of TIERS.entries()) {
    const meme = memes[i % memes.length]
    const reshares = Math.max(tier.minReshares, 1) * 3
    const png = await renderCard(
      MemeCard({
        title: meme?.title ?? 'Untitled',
        reshares,
        uniqueRefs: Math.round(reshares / 4),
        art: meme ? await fetchArt(meme.imageUrl) : null,
        logo,
        play: null,
      }),
    )
    await writeFile(join(dir, `meme-${tier.key}.png`), png)
    console.log(`meme-${tier.key}.png · "${meme?.title}" · ${(png.length / 1024).toFixed(0)} KB`)
  }

  const avatar = memes[3] ? await fetchArt(memes[3].imageUrl) : null
  const profile = await renderCard(
    ProfileCard({ name: 'Ada Lovelace', coins: 12_480, collectionSize: 64, avatar, logo }),
  )
  await writeFile(join(dir, 'profile.png'), profile)
  console.log(`profile.png · ${(profile.length / 1024).toFixed(0)} KB`)

  const sleeves = await Promise.all(
    TIERS.slice(1, 6).map(async (tier, i) => ({
      tier,
      art: memes[i] ? await fetchArt(memes[i].imageUrl) : null,
    })),
  )
  const binder = await renderCard(
    BinderCard({ name: 'Ada Lovelace', collectionSize: 64, value: 12_480, avatar, logo, sleeves }),
  )
  await writeFile(join(dir, 'binder.png'), binder)
  console.log(`binder.png · ${(binder.length / 1024).toFixed(0)} KB`)

  console.log(`\npreviews in ${dir}`)
}

await (args.includes('--home') ? renderHome() : renderPreview())
