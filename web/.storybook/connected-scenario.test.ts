import { describe, expect, it } from 'vitest'
import { createConnectedScenario } from './connected-scenario'

function postMeme(scenario: ReturnType<typeof createConnectedScenario>, body: unknown) {
  return scenario.handle(
    new Request('https://story.test/api/memes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

describe('ConnectedScenario POST /api/memes', () => {
  it('mints a distinct id without rewriting the story-mint fixture', async () => {
    const scenario = createConnectedScenario('unique-mint')
    const snapshot = structuredClone(scenario.mintedMeme)
    expect(snapshot).toMatchObject({ id: 'meme-minted', title: 'story mint' })

    const first = await postMeme(scenario, {
      title: 'generated story',
      imageUrl: 'https://media.example.test/one.png',
      source: {
        provider: 'giphy',
        id: 'giphy-cat',
        url: 'https://giphy.example/c',
        author: null,
      },
    })
    expect(first.status).toBe(200)
    await expect(first.json()).resolves.toMatchObject({
      meme: {
        id: 'meme-minted',
        title: 'generated story',
        imageUrl: 'https://media.example.test/one.png',
        source: {
          provider: 'giphy',
          id: 'giphy-cat',
          url: 'https://giphy.example/c',
          author: null,
        },
      },
    })

    const second = await postMeme(scenario, { title: 'second story' })
    expect(second.status).toBe(200)
    await expect(second.json()).resolves.toMatchObject({
      meme: {
        id: 'meme-minted-2',
        title: 'second story',
        imageUrl: snapshot.imageUrl,
        source: null,
      },
    })

    const minted = scenario.memes.filter((meme) => meme.id === 'meme-minted')
    const mintedTwo = scenario.memes.filter((meme) => meme.id === 'meme-minted-2')
    expect(minted).toHaveLength(1)
    expect(mintedTwo).toHaveLength(1)
    expect(minted[0]).not.toBe(scenario.mintedMeme)
    expect(minted[0]?.title).toBe('generated story')
    expect(scenario.mintedMeme).toEqual(snapshot)

    const mintedDetail = await scenario.handle(
      new Request('https://story.test/api/memes/meme-minted'),
    )
    const mintedTwoDetail = await scenario.handle(
      new Request('https://story.test/api/memes/meme-minted-2'),
    )
    await expect(mintedDetail.json()).resolves.toMatchObject({ meme: { title: 'generated story' } })
    await expect(mintedTwoDetail.json()).resolves.toMatchObject({ meme: { title: 'second story' } })

    const removed = await scenario.handle(
      new Request('https://story.test/api/memes/meme-minted', { method: 'DELETE' }),
    )
    expect(removed.status).toBe(200)
    expect(scenario.memes.filter((meme) => meme.id === 'meme-minted')).toHaveLength(0)
    expect(scenario.memes.filter((meme) => meme.id === 'meme-minted-2')).toHaveLength(1)
    const stillThere = await scenario.handle(
      new Request('https://story.test/api/memes/meme-minted-2'),
    )
    await expect(stillThere.json()).resolves.toMatchObject({ meme: { title: 'second story' } })

    const cursorPage = await scenario.handle(
      new Request('https://story.test/api/memes?cursor=page-2'),
    )
    const cursorBody = (await cursorPage.json()) as { memes: Array<{ id: string; title: string }> }
    expect(cursorBody.memes).toHaveLength(1)
    expect(cursorBody.memes[0]).toMatchObject({ id: snapshot.id, title: 'story mint' })
  })

  it('keeps a supplied id and skips a taken suffix', async () => {
    const scenario = createConnectedScenario('supplied-mint-id')
    const snapshot = structuredClone(scenario.mintedMeme)

    const held = await postMeme(scenario, { id: 'meme-minted-2', title: 'held' })
    expect(held.status).toBe(200)
    await expect(held.json()).resolves.toMatchObject({
      meme: { id: 'meme-minted-2', title: 'held' },
    })
    expect(scenario.mintedMeme.id).toBe(snapshot.id)
    expect(scenario.mintedMeme.title).toBe(snapshot.title)

    const firstFree = await postMeme(scenario, { title: 'first free' })
    await expect(firstFree.json()).resolves.toMatchObject({
      meme: { id: 'meme-minted', title: 'first free' },
    })

    const next = await postMeme(scenario, { title: 'next' })
    await expect(next.json()).resolves.toMatchObject({
      meme: { id: 'meme-minted-3', title: 'next' },
    })

    expect(scenario.memes.filter((meme) => meme.id === 'meme-minted')).toHaveLength(1)
    expect(scenario.memes.filter((meme) => meme.id === 'meme-minted-2')).toHaveLength(1)
    expect(scenario.memes.filter((meme) => meme.id === 'meme-minted-3')).toHaveLength(1)
    expect(scenario.mintedMeme).toEqual(snapshot)
  })
})
