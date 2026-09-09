import type { Meta, StoryObj } from '@storybook/react-vite'
import { SideSummary } from './SideSummary'
import type { TradeSideSummaryModel } from './tradeCardModel'

const empty: TradeSideSummaryModel = { ownerLabel: 'Lou gives', empty: true, memeLines: [], coinsLabel: null }
const meta = { title: 'Molecules/SideSummary', component: SideSummary, args: { model: empty } } satisfies Meta<typeof SideSummary>
export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
export const SharesAndCoins: Story = { args: { model: { ownerLabel: 'pal gives', empty: false, memeLines: [{ id: 'meme-1', sharesLabel: '10 shares of', title: 'Receipt dog' }], coinsLabel: '🧠 120' } } }
