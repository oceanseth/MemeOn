import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { listedHolo, memeplexFamily, paperMeme } from '../../.storybook/fixtures'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { plural, pluralWord } from '../lib/plural'
import { buildMemeplexPanelModel } from '../organisms/memeplexPanelModel'
import { buildTierLadderModel, type DetailListingModel, type MemeDetailModel, type MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from './MemeDetailScreen'

const noop = fn()
const closedDialog = (id: string) => buildConfirmDialogModel({ open: false, id, title: 'Confirm', message: '', onCancel: noop, onConfirm: noop })
const detail = (meme = paperMeme): MemeDetailModel => ({
  id: meme.id, title: meme.title, private: !!meme.private, tierKey: meme.tier.key, tierColor: meme.tier.color, tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`, tierHype: meme.tier.hype,
  tierLadder: buildTierLadderModel(meme.tier.key, meme.views ?? meme.reshares),
  card: buildMemeCardModel(meme), creatorLinkProps: { to: `/u/${meme.creatorId}` }, creatorName: meme.creatorName, ownerLinkProps: { to: `/u/${meme.ownerId}` }, ownerName: meme.ownerName, tagsLabel: null, viewsLabel: String(meme.views ?? meme.reshares), resharesLabel: String(meme.reshareCount ?? 0), viewsWord: pluralWord(meme.views ?? meme.reshares, 'view'), resharesWord: pluralWord(meme.reshareCount ?? 0, 'reshare'), valueLabel: String(meme.value), statsSrLabel: `${plural(meme.views ?? meme.reshares, 'view')}, ${plural(meme.reshareCount ?? 0, 'reshare')}`, valueSrLabel: `${meme.value} braincells card value`, holdingsLabel: '100/100', shareInputProps: { value: `https://memeon.ai/m/${meme.id}`, readOnly: true, 'aria-label': 'Share link for this meme' }, copyButtonLabel: 'Copy link', copyButtonProps: { onClick: noop }, previewLinkProps: { href: `/api/memes/${meme.id}/og.png`, target: '_blank', rel: 'noreferrer' }, signedOut: null, actions: [], notice: null, noticeProps: { role: 'status', 'aria-live': 'polite' }, error: null, errorProps: { role: 'alert', 'aria-live': 'assertive' }, listing: null,
  list: { show: true, disabledReason: null, sharesInputProps: { value: 10, min: 1, max: 100, step: 1, onChange: noop }, priceInputProps: { value: 1, min: .01, step: .01, onChange: noop }, listButtonLabel: 'List', listButtonProps: { onClick: noop, disabled: false, 'aria-busy': false } }, sources: [], plex: buildMemeplexPanelModel({ meme, plex: memeplexFamily, canEdit: true, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }), capTableTitle: 'Who holds this card', capTable: [{ userId: 'me', label: 'You', sharesLabel: '100/100' }], deleteDialog: buildConfirmDialogModel({ open: false, id: 'delete-meme', title: 'Delete this meme forever?', message: 'This cannot be undone.', danger: true, onCancel: noop, onConfirm: noop }), buyDialog: closedDialog('buy-shares'), claimDialog: closedDialog('claim-meme'),
})
const listingModel = (overrides: Partial<DetailListingModel> = {}): DetailListingModel => ({
  cardLabel: '10 sh @ 🧠4', saleLabel: 'On sale: 10 shares @ 🧠4/share', sharesLabel: '10 shares', priceLabel: '🧠4/share', showBuy: true, showUnlist: false,
  buyLabel: 'shares to buy', balanceLabel: '🧠240 available', disabledReason: null,
  buyInputProps: { value: 2, min: 1, max: 10, step: 1, onChange: noop },
  buyButtonLabel: 'Buy for 🧠8', buyButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  unlistButtonLabel: 'Remove listing', unlistButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  ...overrides,
})
const listed = (overrides: Partial<DetailListingModel> = {}): MemeDetailModel => {
  const base = detail(listedHolo)
  const listing = listingModel(overrides)
  return {
    ...base, list: { ...base.list, show: false }, holdingsLabel: null,
    capTable: [{ userId: 'seller', label: 'lou', sharesLabel: '100/100' }], listing,
    // the hero's "for sale" badge mirrors this mocked listing price, not listedHolo's own
    card: { ...base.card, listing: { ...base.card.listing!, sharesLabel: listing.cardLabel } },
  }
}
const base: MemeDetailScreenModel = {
  phase: 'ready', showNotFound: false, showLoading: false,
  notFound: { message: "This meme isn't here — it may have been deleted or made private.", linkProps: { to: '/marketplace' }, linkLabel: 'Browse the marketplace' },
  loadingLabel: 'Pulling the card…',
  detail: detail(),
}
const meta = { title: 'Screens/MemeDetailScreen', component: MemeDetailScreen, args: base, decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>] } satisfies Meta<typeof MemeDetailScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = { args: { phase: 'loading', showLoading: true, detail: null } }
export const Empty: Story = { args: { phase: 'empty', showNotFound: true, detail: null } }
export const Error: Story = { args: { phase: 'error', detail: { ...detail(), error: 'action failed' } } }
export const Ready: Story = {}
export const Notice: Story = { args: { detail: { ...detail(), notice: 'Listed on the marketplace 🏷️' } } }

/** The share-link arrival: no session, so the card sells the login instead of dead-ending. */
export const Visitor: Story = {
  args: {
    detail: {
      ...detail(), holdingsLabel: null, actions: [], list: { ...detail().list, show: false },
      plex: buildMemeplexPanelModel({ meme: paperMeme, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }),
      capTable: [{ userId: 'someone', label: 'another collector', sharesLabel: '100/100' }],
      signedOut: {
        title: 'Own a piece of this', body: 'Log in with Masky to buy shares, remix it, or mint your own.',
        loginLabel: '🎭 Log in with Masky',
        loginButtonProps: { onClick: noop, disabled: false, 'aria-busy': false, 'aria-label': 'Log in with Masky' },
        browseLinkProps: { to: '/marketplace' }, browseLabel: 'Browse the marketplace', error: null, errorProps: { role: 'alert' },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Log in with Masky' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Browse the marketplace' })).toBeVisible()
  },
}
export const VisitorListed: Story = {
  args: {
    detail: {
      ...listed({ showBuy: false, balanceLabel: null }), holdingsLabel: null,
      plex: buildMemeplexPanelModel({ meme: listedHolo, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }),
      signedOut: {
        title: 'Own a piece of this', body: 'Log in with Masky to buy shares, remix it, or mint your own.',
        loginLabel: '🎭 Log in with Masky',
        loginButtonProps: { onClick: noop, disabled: false, 'aria-busy': false, 'aria-label': 'Log in with Masky' },
        browseLinkProps: { to: '/marketplace' }, browseLabel: 'Browse the marketplace', error: null, errorProps: { role: 'alert' },
      },
    },
  },
}

export const Listing: Story = { args: { phase: 'listing', detail: { ...detail(), list: { ...detail().list, listButtonLabel: 'Listing…', listButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } } } } }
export const ListOverHoldings: Story = { args: { detail: { ...detail(), holdingsLabel: '40/100', list: { ...detail().list, disabledReason: 'You only hold 40 shares.', sharesInputProps: { value: 60, min: 1, max: 40, step: 1, onChange: noop }, listButtonProps: { onClick: noop, disabled: true, 'aria-busy': false } } } } }
export const Buying: Story = {
  args: { phase: 'buying', detail: listed({ buyButtonLabel: 'Buying…', buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('spinbutton', { name: 'shares to buy' })).toHaveAttribute('max', '10')
    await expect(canvas.getByRole('button', { name: 'Buying…' })).toBeDisabled()
  },
}
export const InsufficientBalance: Story = {
  args: { detail: listed({ balanceLabel: '🧠3 available', disabledReason: '🧠5 short — sell some shares or open a pack first.', buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': false } }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Buy for 🧠8' })).toBeDisabled()
    await expect(canvas.getByText('🧠5 short — sell some shares or open a pack first.')).toBeVisible()
  },
}
export const Unlisting: Story = { args: { phase: 'listing', detail: listed({ showBuy: false, showUnlist: true, unlistButtonLabel: 'Removing…', unlistButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } }) } }

/** Restating an irreversible spend before it leaves the wallet. */
export const ConfirmBuy: Story = {
  args: {
    detail: {
      ...listed({ buyInputProps: { value: 10, min: 1, max: 10, step: 1, onChange: noop }, buyButtonLabel: 'Buy for 🧠40' }),
      buyDialog: buildConfirmDialogModel({ open: true, id: 'buy-shares', title: 'Spend 🧠40?', message: '10 shares of "holo hit" at 🧠4/share. You hold 🧠240, and purchases are final.', confirmLabel: 'Buy 10 shares', onCancel: noop, onConfirm: noop }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alertdialog', { name: 'Spend 🧠40?' })).toBeVisible()
  },
}

/** The archive claim, in the app's own dialog instead of window.prompt(). */
export const ClaimPrompt: Story = {
  args: {
    detail: {
      ...detail(),
      actions: [{ label: '📼 This is my meme — claim it', buttonProps: { onClick: noop } }],
      claimDialog: buildConfirmDialogModel({
        open: true, id: 'claim-meme', title: 'Claim this meme?',
        message: 'This card is sitting in the archive. Tell us why it belongs to you and we’ll take a look.',
        confirmLabel: 'File the claim',
        prompt: { label: 'Why is this meme yours?', value: '', placeholder: 'the original post, your handle, anything that proves it', maxLength: 400, hint: 'Links help your case.', onChange: noop },
        onCancel: noop, onConfirm: noop,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: /Why is this meme yours/ })).toBeVisible()
  },
}

export const Deleting: Story = {
  args: (() => {
    const onCancel = fn()
    return {
      phase: 'deleting' as const,
      detail: {
        ...detail(),
        deleteDialog: buildConfirmDialogModel({ open: true, id: 'delete-meme', title: 'Delete this meme forever?', message: 'This cannot be undone.', danger: true, busy: true, onCancel, onConfirm: noop }),
      },
    }
  })(),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    // in flight: the label stays readable and the backdrop no longer dismisses behind the request
    const confirm = canvas.getByRole('button', { name: 'Working…' })
    await expect(confirm).toHaveAttribute('aria-busy', 'true')
    await expect(confirm).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(dialog)
    const onCancel = args.detail?.deleteDialog.cancelButtonProps.onClick
    await expect(onCancel).toBeUndefined()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  },
}

/* story-local: a wide two-panel joke, the shape real uploads take. The square thumb crop would
   eat both captions, so the hero letterboxes it on the media plate. */
const WIDE_ART = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
    '<rect width="640" height="360" fill="#1d2233"/>' +
    '<rect x="4" y="4" width="312" height="352" fill="#2a3147"/>' +
    '<rect x="324" y="4" width="312" height="352" fill="#3a2140"/>' +
    '<text x="18" y="48" fill="#e8ecf4" font-family="system-ui" font-size="26">MY IDEA</text>' +
    '<text x="338" y="48" fill="#e8ecf4" font-family="system-ui" font-size="26">MY IDEA AFTER</text>' +
    '<text x="338" y="84" fill="#e8ecf4" font-family="system-ui" font-size="26">ASKING CHATGPT</text>' +
    '</svg>',
)}`

/** Real art is 16:9, 4:5, 2:3 — never square. The caption has to survive the hero frame. */
export const WideArt: Story = {
  args: {
    detail: {
      ...detail(),
      card: { ...detail().card, media: { kind: 'image', imageProps: { src: WIDE_ART, alt: 'MY IDEA / MY IDEA AFTER ASKING CHATGPT', loading: 'eager' } } },
    },
  },
}

/** One view, one reshare: the nouns agree with the figures instead of reading "1 reshares". */
export const SingleReshare: Story = {
  args: {
    detail: {
      ...detail(),
      viewsLabel: '1', resharesLabel: '1',
      viewsWord: pluralWord(1, 'view'), resharesWord: pluralWord(1, 'reshare'),
      statsSrLabel: `${plural(1, 'view')}, ${plural(1, 'reshare')}`,
      card: { ...detail().card, viewsLabel: '1', resharesLabel: '1', statsA11yLabel: '1 views, 1 reshares' },
    },
  },
}

/** A card one rung from the top: the ladder states the next threshold instead of implying it. */
export const TierLadderMaxed: Story = {
  args: { detail: { ...detail(), tierKey: 'shiny', tierColor: '#9fffe0', tierLabel: 'Shiny · Mythic Shiny', tierLadder: buildTierLadderModel('shiny', 41_000), viewsLabel: '41,000', statsSrLabel: `${plural(41_000, 'view')}, ${plural(900, 'reshare')}`,
    card: { ...detail().card, tierKey: 'shiny', tierColor: '#9fffe0', tierLabel: 'Shiny · Mythic Shiny', viewsLabel: '41,000' } } },
}
export const CapTableUnresolved: Story = {
  args: { detail: { ...detail(), holdingsLabel: '40/100', capTable: [{ userId: 'me', label: 'You', sharesLabel: '40/100' }, { userId: 'a', label: 'another collector', sharesLabel: '35/100' }, { userId: 'b', label: 'another collector', sharesLabel: '25/100' }] } },
}
