import { describe, expect, it } from 'vitest'
import { proposedTrade } from '../../.storybook/fixtures'
import { tradesCopy } from '../copy/trades'
import { braincells } from './braincells'
import { buildTradeCardModel } from './tradeCardModel'

const memeIds = (side: { memeLines: readonly { id: string }[] }) =>
  side.memeLines.map((line) => line.id)
const wireMemeIds = (side: { memes: readonly { memeId: string }[] }) =>
  side.memes.map((meme) => meme.memeId)

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

  it('incoming finality spells tier shares from copy', () => {
    const { finality } = tradesCopy.card
    expect(finality.tierShares(1, null)).toBe('1 share')
    expect(finality.tierShares(2, null)).toBe('2 shares')
    expect(finality.tierShares(2, '')).toBe('2 shares')
    expect(finality.tierShares(1, 'Holo')).toBe('1 Holo share')
    expect(finality.tierShares(2, 'Silver')).toBe('2 Silver shares')
    expect(finality.tierShares(1500, null)).toBe('1500 shares')

    const tierInfo = (tierName: string) => ({
      title: tierName,
      imageUrl: '',
      tierKey: tierName.toLowerCase(),
      tierName,
      tierLabel: tierName,
      reshares: 0,
    })
    const coins = braincells(proposedTrade.ask.coins)
    const incoming = buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: { 'meme-silver': tierInfo('Silver') },
      onRespond: () => {},
    })
    expect(incoming.finalityLine).toBe(
      finality.leaves(finality.and(finality.tierShares(2, 'Silver'), coins)),
    )
    expect(incoming.finalityLine).not.toContain('shares of')

    const unresolved = buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: {},
      onRespond: () => {},
    })
    expect(unresolved.finalityLine).toBe(
      finality.leaves(finality.and(finality.tierShares(2, null), coins)),
    )

    const oneShare = buildTradeCardModel({
      trade: {
        ...proposedTrade,
        ask: { memes: [{ memeId: 'meme-holo', shares: 1 }], coins: 0 },
      },
      meSub: 'not-the-sender',
      memeNames: { 'meme-holo': tierInfo('Holo') },
      onRespond: () => {},
    })
    expect(oneShare.finalityLine).toBe(finality.leaves(finality.tierShares(1, 'Holo')))

    const outgoing = buildTradeCardModel({
      trade: proposedTrade,
      meSub: proposedTrade.fromId,
      memeNames: {},
      onRespond: () => {},
    })
    expect(outgoing.finalityLine).toBeNull()

    const unanswered = buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: {},
    })
    expect(unanswered.finalityLine).toBeNull()
  })
})
