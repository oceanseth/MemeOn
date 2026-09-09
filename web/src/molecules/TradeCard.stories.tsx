import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { proposedTrade } from '../../.storybook/fixtures'
import { TradeCard } from './TradeCard'
import { buildTradeCardModel } from './tradeCardModel'

const onRespond = fn()

const meta = {
  title: 'Molecules/TradeCard',
  component: TradeCard,
  args: {
    model: buildTradeCardModel({
      trade: proposedTrade,
      meSub: 'not-the-sender',
      memeNames: {},
      onRespond,
    }),
  },
} satisfies Meta<typeof TradeCard>

export default meta
type Story = StoryObj<typeof meta>

export const Incoming: Story = {}
export const Outgoing: Story = {
  args: {
    model: buildTradeCardModel({ trade: proposedTrade, meSub: proposedTrade.fromId, memeNames: {}, onRespond }),
  },
}
export const Resolved: Story = {
  args: {
    model: buildTradeCardModel({
      trade: { ...proposedTrade, status: 'accepted' },
      meSub: proposedTrade.fromId,
      memeNames: {},
    }),
  },
}
