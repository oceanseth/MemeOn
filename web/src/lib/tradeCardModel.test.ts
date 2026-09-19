import { describe, expect, it } from 'vitest'
import { proposedTrade } from '../../.storybook/fixtures'
import { tradesCopy } from '../copy/trades'
import { braincells } from './braincells'
import { buildTradeCardModel } from './tradeCardModel'

const memeIds = (side: { memeLines: readonly { id: string }[] }) => side.memeLines.map((line) => line.id)
const wireMemeIds = (side: { memes: readonly { memeId: string }[] }) => side.memes.map((meme) => meme.memeId)

describe('buildTradeCardModel perspective', () => {
  it('incoming: give is wire ask, get is wire offer', () => {
    const model = buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: {},
    })

    expect(memeIds(model.give)).toEqual(wireMemeIds(proposedTrade.ask))
    expect(memeIds(model.get)).toEqual(wireMemeIds(proposedTrade.offer))
    expect(model.give.braincellsLabel).toBe(braincells(proposedTrade.ask.coins))
    expect(model.get.braincellsLabel).toBeNull()
    expect(model.give.ownerLabel).toBe(tradesCopy.card.sides.give)
    expect(model.get.ownerLabel).toBe(tradesCopy.card.sides.get)
    expect(model.give.emptyLabel).toBe(tradesCopy.card.sideSentence.nothing)
    expect(model.get.emptyLabel).toBe(tradesCopy.card.sideSentence.nothing)
  })

  it('outgoing: give is wire offer, get is wire ask', () => {
    const model = buildTradeCardModel({
      trade: proposedTrade,
      meSub: proposedTrade.fromId,
      memeNames: {},
    })

    expect(memeIds(model.give)).toEqual(wireMemeIds(proposedTrade.offer))
    expect(memeIds(model.get)).toEqual(wireMemeIds(proposedTrade.ask))
    expect(model.give.braincellsLabel).toBeNull()
    expect(model.get.braincellsLabel).toBe(braincells(proposedTrade.ask.coins))
  })
})
