import { createActor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import { listedHolo, meLou, paperMeme } from '../../.storybook/fixtures'
import { memeDetailCopy as copy } from '../copy/memeDetail'
import { memeDetailMachine } from '../stores/memeDetailMachine'
import {
  buildMemeDetailModel,
  buildTierLadderModel,
  type MemeDetailModelActions,
} from './memeDetailModel'
import type { Me, Meme } from './types'

describe('buildTierLadderModel', () => {
  it('places paper at 50% of the first rung at 5 views', () => {
    expect(buildTierLadderModel('paper', 5).value).toBe(50)
  })

  it('fills the meter at the top of the ladder', () => {
    expect(buildTierLadderModel('shiny', 41_000).value).toBe(100)
  })
})

function actions(): MemeDetailModelActions {
  return {
    onBuySharesChange: vi.fn(),
    onSellSharesChange: vi.fn(),
    onPriceChange: vi.fn(),
    onCopy: vi.fn(),
    onPlexAdd: vi.fn(),
    onPlexPickChange: vi.fn(),
    onPlexPastedChange: vi.fn(),
    onRemix: vi.fn(),
    onLogin: vi.fn(),
    onStartClaim: vi.fn(),
    onStartDelete: vi.fn(),
    onToggleVisibility: vi.fn(),
    onUnlist: vi.fn(),
    onList: vi.fn(),
    requestBuyConfirm: vi.fn(),
    runBuy: vi.fn(),
    onDeleteCancel: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onBuyCancel: vi.fn(),
    onClaimCancel: vi.fn(),
    onClaimConfirm: vi.fn(),
    onClaimNoteChange: vi.fn(),
  }
}

function detail({
  copied,
  copyFailed,
  meme = paperMeme,
  user = null,
  buyShares,
}: {
  copied?: boolean
  copyFailed?: boolean
  meme?: Meme
  user?: Me | null
  buyShares?: number
} = {}) {
  const context = {
    ...createActor(memeDetailMachine, {
      input: { id: meme.id },
    }).getSnapshot().context,
    ...(copied === undefined ? {} : { copied }),
    ...(copyFailed === undefined ? {} : { copyFailed }),
    ...(buyShares === undefined ? {} : { buyShares }),
  }
  return buildMemeDetailModel({
    phase: 'ready',
    context,
    meme,
    user,
    shareUrl: `https://memeon.ai/m/${meme.id}`,
    holderNameCache: new Map(),
    actions: actions(),
  })
}

describe('buildMemeDetailModel copy state', () => {
  it('plumbs copyDone and copyButtonLabel for idle, copied, and failed', () => {
    const idle = detail()
    expect(idle.copyDone).toBe(false)
    expect(idle.copyButtonLabel).toBe(copy.share.copy)

    const copied = detail({ copied: true })
    expect(copied.copyDone).toBe(true)
    expect(copied.copyButtonLabel).toBe(copy.share.copied)

    const failed = detail({ copyFailed: true })
    expect(failed.copyDone).toBe(false)
    expect(failed.copyButtonLabel).toBe(copy.share.copyFailed)
  })
})

describe('buildMemeDetailModel buy above the listing', () => {
  function listedBuy(buyShares: number, coins: number) {
    const model = detail({
      meme: listedHolo,
      user: { ...meLou, sub: 'user-buyer', coins },
      buyShares,
    })
    expect(model.listing?.showBuy).toBe(true)
    return model.listing
  }

  it('disables a funded buy that asks for more shares than are listed', () => {
    const listing = listedBuy(11, 100)
    expect(listing?.disabledReason).toBe(copy.listing.onlyListed(10))
    expect(listing?.buyButtonProps.disabled).toBe(true)
  })

  it('still asks for at least one share', () => {
    expect(listedBuy(0, 100)?.disabledReason).toBe(copy.listing.pickAtLeastOne)
  })

  it('still reports a coin shortfall when the buy fits the listing', () => {
    expect(listedBuy(2, 0)?.disabledReason).toBe(copy.listing.short(6))
  })

  it('prefers the listing cap over a coin shortfall', () => {
    const listing = listedBuy(11, 0)
    expect(listing?.disabledReason).toBe(copy.listing.onlyListed(10))
    expect(listing?.disabledReason).not.toBe(copy.listing.short(33))
  })
})

describe('buildMemeDetailModel label formatters', () => {
  it('formats tags, holdings, and cap rows through copy', () => {
    const context = {
      ...createActor(memeDetailMachine, {
        input: { id: paperMeme.id },
      }).getSnapshot().context,
      positions: [
        { memeId: paperMeme.id, userId: 'user-lou', shares: 40 },
        { memeId: paperMeme.id, userId: 'user-pal', shares: 60 },
      ],
    }
    const model = buildMemeDetailModel({
      phase: 'ready',
      context,
      meme: { ...paperMeme, tags: ['cat', 'foil'] },
      user: meLou,
      shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
      holderNameCache: new Map(),
      actions: actions(),
    })

    expect(model.tagsLabel).toBe(copy.tags(['cat', 'foil']))
    expect(model.holdingsLabel).toBe(copy.provenance.holdings(40))
    expect(model.capTable.map((row) => row.sharesLabel)).toEqual([
      copy.capTable.shares(40),
      copy.capTable.shares(60),
    ])
  })

  it('leaves tags and holdings blank when the meme has none and the reader holds nothing', () => {
    const model = detail()
    expect(model.tagsLabel).toBeNull()
    expect(model.holdingsLabel).toBeNull()
  })
})
