import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { paperMeme } from '../../.storybook/fixtures'
import { SideSummary } from '@/molecules/side-summary'
import type { TradeSideSummaryModel } from '../lib/tradeCardModel'

const empty: TradeSideSummaryModel = { ownerLabel: 'You give', empty: true, memeLines: [], coinsLabel: null }
const meta = { title: 'Molecules/SideSummary', component: SideSummary, args: { model: empty } } satisfies Meta<typeof SideSummary>
export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
/** the record has not landed: a placeholder title, never the raw id */
export const PendingMeme: Story = { args: { model: { ownerLabel: 'You get', empty: false, memeLines: [{ id: 'meme-2', sharesLabel: '3 shares of', title: '…', thumbUrl: null, tierKey: null, tierName: null, tierLabel: null, resharesLabel: null, detailHref: '/m/meme-2' }], coinsLabel: null } } }
export const SharesAndCoins: Story = { args: { model: { ownerLabel: 'You get', empty: false, memeLines: [{ id: 'meme-1', sharesLabel: '10 shares of', title: 'Receipt dog', thumbUrl: paperMeme.imageUrl, tierKey: 'paper', tierName: 'Paper', tierLabel: 'Paper · common', resharesLabel: '0', detailHref: '/m/meme-1' }], coinsLabel: '120' } } }
/** Every meme line is an `Item` row: thumb in the media slot, tier chip in the actions slot. */
export const Rows: Story = {
  ...SharesAndCoins,
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('[data-slot="item"]')
    await expect(rows).toHaveLength(1)
    /* the thumb is decorative (`alt=""`), so it is read from the media slot, not by role */
    await expect(rows[0]!.querySelector('[data-slot="item-media"] img')).toHaveAttribute('src', paperMeme.imageUrl)
    await expect(canvasElement.querySelector('[data-slot="item-actions"]')).not.toBeNull()
  },
}
