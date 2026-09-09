import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { friendAccepted, giftablePaper, giftableSilver, holoMeme, listedHolo } from '../../.storybook/fixtures'
import type { Meme } from '../lib/types'
import { buildGiftDialogModel, type BuildGiftDialogModelInput } from '../lib/giftDialogModel'
import { GiftDialog } from './GiftDialog'

const recipient = { sub: friendAccepted.sub, name: friendAccepted.name }

// story-local: the rarity ladder a player can actually give away, plus a listed holding
const giftableHolo: Meme = { ...holoMeme, myShares: 30 }
const giftableListed: Meme = { ...listedHolo, myShares: 100 }
const ladder = [giftablePaper, giftableSilver, giftableHolo, giftableListed]

const model = (overrides: Partial<BuildGiftDialogModelInput> = {}) =>
  buildGiftDialogModel({
    open: true,
    recipient,
    memes: ladder,
    query: '',
    pick: null,
    shares: 1,
    busy: false,
    error: null,
    onQueryChange: fn(),
    onPick: fn(),
    onSharesChange: fn(),
    onSharesBlur: fn(),
    onClose: fn(),
    onSubmit: fn(),
    ...overrides,
  })

const meta = {
  title: 'Molecules/GiftDialog',
  component: GiftDialog,
  args: { model: model() },
} satisfies Meta<typeof GiftDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {}
export const EmptyBinder: Story = { args: { model: model({ memes: [] }) } }
export const Filtered: Story = { args: { model: model({ query: 'silver' }) } }
export const NoMatch: Story = { args: { model: model({ query: 'zzz' }) } }
export const Picked: Story = { args: { model: model({ pick: giftablePaper, shares: 3 }) } }
export const SharesFieldCleared: Story = {
  args: { model: model({ pick: giftablePaper, shares: 3, sharesInput: '' }) },
}
/** In flight: nothing here is live-but-inert — the exits, the list and both fields say so. */
export const Busy: Story = {
  args: { model: model({ pick: giftablePaper, shares: 3, busy: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Close gift dialog' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await expect(canvas.getByRole('searchbox', { name: 'Search your binder' })).toBeDisabled()
    await expect(canvas.getByRole('spinbutton', { name: /Shares to gift/ })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /Gifting/ })).toBeDisabled()
    for (const row of canvasElement.querySelectorAll('.gift-row')) {
      await expect(row).toBeDisabled()
    }
  },
}
export const Error: Story = {
  args: { model: model({ pick: giftablePaper, shares: 3, error: 'not enough shares' }) },
}
export const Closed: Story = { args: { model: model({ open: false, memes: [] }) } }
