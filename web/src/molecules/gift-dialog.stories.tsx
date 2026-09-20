import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import {
  friendAccepted,
  giftablePaper,
  giftableSilver,
  holoMeme,
  listedHolo,
} from '../../.storybook/fixtures'
import { giftDialogCopy as copy } from '../copy/giftDialog'
import type { Meme } from '../lib/types'
import { buildGiftDialogModel, type BuildGiftDialogModelInput } from '../lib/giftDialogModel'
import { GiftDialog } from '@/molecules/gift-dialog'

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

const rows = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll<HTMLElement>('[data-slot="gift-list"] [data-slot="item"]')

const meta = {
  title: 'Molecules/GiftDialog',
  component: GiftDialog,
  args: { model: model() },
} satisfies Meta<typeof GiftDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The picker: focus lands in the search, every holding is a row that is its own button. */
export const Search: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: /Gift to/ })
    await expect(dialog).toHaveAccessibleDescription(/Pick a meme you hold shares in/)
    // Base UI would park focus on the first tab stop (the ✕); the binder search is the task
    await waitFor(() => expect(canvas.getByRole('searchbox', { name: copy.search })).toHaveFocus())
    await expect(canvas.getByRole('searchbox', { name: copy.search })).toHaveAttribute(
      'placeholder',
      copy.searchPlaceholder,
    )
    await expect(rows(canvasElement)).toHaveLength(4)
    for (const row of rows(canvasElement)) {
      await expect(row.tagName).toBe('BUTTON')
      await expect(row).toHaveAttribute('aria-pressed', 'false')
      await expect(row.offsetHeight).toBeGreaterThanOrEqual(44)
      for (const slot of [
        'item-media',
        'item-title',
        'item-description',
        'item-actions',
        'tier-chip',
      ]) {
        await expect(row.querySelector(`[data-slot="${slot}"]`)).not.toBeNull()
      }
    }
    await expect(
      canvas.getByRole('button', { name: new RegExp(giftablePaper.title) }),
    ).toBeInTheDocument()
    await expect(canvas.getByText('Listed')).toHaveAttribute('data-slot', 'badge')
    // nothing picked yet: the shares field and the submit wait
    await expect(canvas.queryByRole('spinbutton')).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeEnabled()
  },
}
export const EmptyBinder: Story = {
  args: { model: model({ memes: [] }) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Nothing to gift here/)).toBeInTheDocument()
    await expect(rows(canvasElement)).toHaveLength(0)
  },
}
export const Filtered: Story = { args: { model: model({ query: 'silver' }) } }
export const NoMatch: Story = { args: { model: model({ query: 'zzz' }) } }
/** A pick: the row wears the pressed well and says so, and the shares field appears in the footer. */
export const Picked: Story = {
  args: { model: model({ pick: giftablePaper, shares: 3 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the submit names the pick too, so the row is found by its state, not its name
    const picked = [...rows(canvasElement)].find(
      (row) => row.getAttribute('aria-pressed') === 'true',
    )!
    await expect(picked).toHaveTextContent(giftablePaper.title)
    const others = [...rows(canvasElement)].filter((row) => row !== picked)
    await expect(others).toHaveLength(3)
    for (const row of others) {
      await expect(row).toHaveAttribute('aria-pressed', 'false')
    }
    const shares = canvas.getByRole('spinbutton', { name: /Shares to gift/ })
    await expect(shares).toHaveValue(3)
    await expect(shares).toHaveAttribute('max', String(giftablePaper.myShares))
    await expect(canvas.getByText('shares')).toHaveAttribute('for', shares.id)
    await expect(canvas.getByText(`of ${giftablePaper.myShares}`)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /^Gift 3 of/ })).toBeEnabled()
  },
}
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
    await expect(canvas.getByRole('searchbox', { name: copy.search })).toBeDisabled()
    await expect(canvas.getByRole('spinbutton', { name: /Shares to gift/ })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /Gifting/ })).toBeDisabled()
    await expect(rows(canvasElement)).toHaveLength(4)
    for (const row of rows(canvasElement)) {
      await expect(row).toBeDisabled()
    }
    // the list stops answering the pointer; each disabled row wears the disabled look itself
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="gift-list"]')!
    await expect(getComputedStyle(list).pointerEvents).toBe('none')
    await expect(parseFloat(getComputedStyle(rows(canvasElement)[0]!).opacity)).toBeLessThan(1)
  },
}
/** The failure lands in a live region that was mounted before it, so it is announced. */
export const Error: Story = {
  args: {
    model: model({
      pick: giftablePaper,
      shares: 3,
      error: 'not enough shares',
    }),
  },
  play: async ({ canvasElement }) => {
    const region = canvasElement.querySelector<HTMLElement>('[data-slot="gift-error"]')!
    await expect(region).toHaveAttribute('role', 'alert')
    const band = region.querySelector('[data-slot="alert"]')
    await expect(band).toHaveAttribute('data-variant', 'error')
    await expect(band).toHaveTextContent('not enough shares')
  },
}
export const Closed: Story = {
  args: { model: model({ open: false, memes: [] }) },
}

/** The dark arm of the picker: pressed row, tier seals and the one bubblegum→sky submit. */
export const Dark: Story = { ...Picked, globals: { theme: 'dark' } }
