import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { proposedTrade } from '../../.storybook/fixtures'
import { TradeCard } from './TradeCard'
import { buildTradeCardModel, type TradeMemeInfoMap } from './tradeCardModel'

const onRespond = fn()

// story-local: a fixed clock so the relative timestamp renders the same on every run
const NOW = new Date(proposedTrade.createdAt).getTime() + 3 * 60 * 60 * 1000

const resolvedNames: TradeMemeInfoMap = {
  'meme-paper': { title: 'fresh paper', imageUrl: '/brand/paper.png', tierKey: 'paper', tierLabel: 'Paper · common', tierColor: '#9aa4bf', reshares: 0 },
  'meme-silver': { title: 'group-chat silver', imageUrl: '/brand/silver.png', tierKey: 'silver', tierLabel: 'Silver · uncommon', tierColor: '#c9d2e4', reshares: 12 },
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

export const Incoming: Story = {}
export const Outgoing: Story = {
  args: {
    model: buildTradeCardModel({ trade: proposedTrade, meSub: proposedTrade.fromId, memeNames: resolvedNames, onRespond, now: NOW }),
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
    model: buildTradeCardModel({ trade: proposedTrade, meSub: 'not-the-sender', memeNames: {}, onRespond, now: NOW }),
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
        'meme-holo': { title: 'holo hit', imageUrl: '/brand/holo.png', tierKey: 'holo', tierLabel: 'Holo · rare', tierColor: '#7fd4ff', reshares: 60 },
      },
      onRespond,
      now: NOW,
    }),
  },
}
