import type { Meta, StoryObj } from '@storybook/react-vite'
import { SideSummary } from './SideSummary'
import type { TradeSideSummaryModel } from './tradeCardModel'

const empty: TradeSideSummaryModel = { ownerLabel: 'You give', empty: true, memeLines: [], coinsLabel: null }
const meta = { title: 'Molecules/SideSummary', component: SideSummary, args: { model: empty } } satisfies Meta<typeof SideSummary>
export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
/** the record has not landed: a placeholder title with pending set, never the raw id */
export const PendingMeme: Story = { args: { model: { ownerLabel: 'You get', empty: false, memeLines: [{ id: 'meme-2', sharesLabel: '3 shares of', title: '…', pending: true, titleAttr: 'meme-2', thumbUrl: null, tierKey: null, tierName: null, tierLabel: null, tierColor: null, resharesLabel: null, detailHref: '/m/meme-2' }], coinsLabel: null } } }
export const SharesAndCoins: Story = { args: { model: { ownerLabel: 'You get', empty: false, memeLines: [{ id: 'meme-1', sharesLabel: '10 shares of', title: 'Receipt dog', pending: false, titleAttr: 'meme-1', thumbUrl: '/brand/paper.png', tierKey: 'paper', tierName: 'Paper', tierLabel: 'Paper · common', tierColor: '#9aa4bf', resharesLabel: '0', detailHref: '/m/meme-1' }], coinsLabel: '🧠 120' } } }
