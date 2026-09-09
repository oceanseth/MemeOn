import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { listedHolo, memeplexFamily, paperMeme } from '../../.storybook/fixtures'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildMemeplexPanelModel } from '../organisms/memeplexPanelModel'
import type { MemeDetailModel, MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from './MemeDetailScreen'

const noop = fn()
const detail = (meme = paperMeme): MemeDetailModel => ({
  id: meme.id, title: meme.title, private: !!meme.private, tierKey: meme.tier.key, tierColor: meme.tier.color, tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`, tierHype: meme.tier.hype,
  media: { kind: 'image', imageProps: { src: meme.imageUrl, alt: meme.title } }, creatorLinkProps: { to: `/u/${meme.creatorId}` }, creatorName: meme.creatorName, ownerLinkProps: { to: `/u/${meme.ownerId}` }, ownerName: meme.ownerName, tagsLabel: null, viewsLabel: '0', resharesLabel: '0', valueLabel: '1', holdingsLabel: '100/100', shareInputProps: { value: `https://memeon.ai/m/${meme.id}`, readOnly: true }, copyButtonLabel: 'Copy link', copyButtonProps: { onClick: noop }, previewLinkProps: { href: `/api/memes/${meme.id}/og.png`, target: '_blank', rel: 'noreferrer' }, actions: [], notice: null, error: null, listing: null,
  list: { show: true, sharesInputProps: { value: 10, min: 1, max: 100, onChange: noop }, priceInputProps: { value: 1, min: .01, step: .01, onChange: noop }, listButtonProps: { onClick: noop, disabled: false } }, sources: [], plex: buildMemeplexPanelModel({ meme, plex: memeplexFamily, canEdit: true, binder: [], pick: '', pasted: '', notice: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }), capTable: [{ userId: 'me', label: 'You', sharesLabel: '100/100' }], deleteDialog: buildConfirmDialogModel({ open: false, title: 'Delete this meme forever?', message: 'This cannot be undone.', danger: true, onCancel: noop, onConfirm: noop }),
})
const base: MemeDetailScreenModel = { phase: 'ready', showNotFound: false, showLoading: false, detail: detail() }
const meta = { title: 'Screens/MemeDetailScreen', component: MemeDetailScreen, args: base, decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>] } satisfies Meta<typeof MemeDetailScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = { args: { phase: 'loading', showLoading: true, detail: null } }
export const Empty: Story = { args: { phase: 'empty', showNotFound: true, detail: null } }
export const Error: Story = { args: { phase: 'error', detail: { ...detail(), error: 'action failed' } } }
export const Ready: Story = {}
export const Listing: Story = { args: { phase: 'listing', detail: { ...detail(), list: { ...detail().list, listButtonProps: { onClick: noop, disabled: true } } } } }
export const Buying: Story = { args: { phase: 'buying', detail: { ...detail(listedHolo), list: { ...detail(listedHolo).list, show: false }, listing: { cardLabel: '10 sh @ 🧠4', saleLabel: 'On sale: 10 shares @ 🧠4/share', sharesLabel: '10 shares', priceLabel: '🧠4/share', showBuy: true, showUnlist: false, buyInputProps: { value: 2, min: 1, max: 10, onChange: noop }, buyButtonLabel: 'Buy for 🧠8', buyButtonProps: { onClick: noop, disabled: true }, unlistButtonProps: { onClick: noop, disabled: false } } } }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await expect(canvas.getByRole('spinbutton')).toHaveAttribute('max', '10'); await expect(canvas.getByRole('button', { name: 'Buy for 🧠8' })).toBeDisabled() } }
export const Deleting: Story = { args: { phase: 'deleting', detail: { ...detail(), deleteDialog: buildConfirmDialogModel({ open: true, title: 'Delete this meme forever?', message: 'This cannot be undone.', danger: true, busy: true, onCancel: noop, onConfirm: noop }) } }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await expect(canvas.getByRole('alertdialog')).toBeVisible(); await expect(canvas.getByRole('button', { name: 'Working…' })).toBeDisabled(); await userEvent.click(canvasElement.querySelector('.pack-overlay')!); await expect(noop).toHaveBeenCalled() } }
