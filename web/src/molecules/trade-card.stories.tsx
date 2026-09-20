import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { holoMeme, paperMeme, proposedTrade, silverMeme } from '../../.storybook/fixtures'
import { tradesCopy } from '../copy/trades'
import { TradeCard } from '@/molecules/trade-card'
import { buildTradeCardModel, type TradeMemeInfoMap } from '../lib/tradeCardModel'

const onRespond = fn()

// story-local: a fixed clock so the relative timestamp renders the same on every run
const NOW = new Date(proposedTrade.createdAt).getTime() + 3 * 60 * 60 * 1000

const resolvedNames: TradeMemeInfoMap = {
  'meme-paper': {
    title: paperMeme.title,
    imageUrl: paperMeme.imageUrl,
    tierKey: 'paper',
    tierName: 'Paper',
    tierLabel: 'Paper · common',
    reshares: 0,
  },
  'meme-silver': {
    title: silverMeme.title,
    imageUrl: silverMeme.imageUrl,
    tierKey: 'silver',
    tierName: 'Silver',
    tierLabel: 'Silver · uncommon',
    reshares: 12,
  },
}

const meta = {
  title: 'Molecules/TradeCard',
  component: TradeCard,
  args: {
    model: buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: resolvedNames,
      onRespond,
      now: NOW,
    }),
  },
} satisfies Meta<typeof TradeCard>

export default meta
type Story = StoryObj<typeof meta>

export const Incoming: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* orientation contract: "You give" left, "You get" right; Decline before Accept */
    const legends = [...canvasElement.querySelectorAll('[data-slot="trade-side"] h3')]
    await expect(legends.map((legend) => legend.textContent)).toEqual([
      tradesCopy.card.sides.give,
      tradesCopy.card.sides.get,
    ])
    await expect(canvas.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Decline',
      'Accept',
    ])
    /* the card's parts: the parties line is the title, the status the header's action slot */
    await expect(canvasElement.querySelector('[data-slot="card-title"]')).toHaveTextContent(
      'lou offered you a deal',
    )
    await expect(canvasElement.querySelector('[data-slot="card-footer"]')).not.toBeNull()
  },
}
export const Outgoing: Story = {
  args: {
    model: buildTradeCardModel({
      trade: proposedTrade,
      meSub: proposedTrade.fromId,
      memeNames: resolvedNames,
      onRespond,
      now: NOW,
    }),
  },
}
export const Resolved: Story = {
  args: {
    model: buildTradeCardModel({
      trade: { ...proposedTrade, status: 'accepted' },
      meSub: proposedTrade.fromId,
      memeNames: resolvedNames,
      now: NOW,
    }),
  },
}
/** every action locks while one respond call is in flight */
export const Acting: Story = {
  args: {
    model: buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: resolvedNames,
      onRespond,
      busyTradeId: proposedTrade.id,
      busyAction: 'accept',
      now: NOW,
    }),
  },
}
/** names have not landed yet: a neutral placeholder, never a raw meme id */
export const UnresolvedMemes: Story = {
  args: {
    model: buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: {},
      onRespond,
      now: NOW,
    }),
  },
}
/** a foil side, and a proposal old enough to fall back to a short date */
export const FoilSide: Story = {
  args: {
    model: buildTradeCardModel({
      trade: {
        ...proposedTrade,
        createdAt: new Date(NOW - 12 * 24 * 60 * 60 * 1000).toISOString(),
        offer: { memes: [{ memeId: 'meme-holo', shares: 1 }], coins: 0 },
      },
      meSub: 'not-the-sender',
      memeNames: {
        ...resolvedNames,
        'meme-holo': {
          title: holoMeme.title,
          imageUrl: holoMeme.imageUrl,
          tierKey: 'holo',
          tierName: 'Holo',
          tierLabel: 'Holo · rare',
          reshares: 60,
        },
      },
      onRespond,
      now: NOW,
    }),
  },
}
