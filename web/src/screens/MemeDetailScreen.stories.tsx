import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { listedHolo, memeplexFamily, paperMeme } from '../../.storybook/fixtures'
import { memeDetailCopy as copy } from '../copy/memeDetail'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildMemeplexPanelModel } from '../lib/memeplexPanelModel'
import { buildTierLadderModel, type DetailListingModel, type DetailSignedOutModel, type MemeDetailModel, type MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from './MemeDetailScreen'

const noop = fn()
const closedDialog = (id: string) => buildConfirmDialogModel({ open: false, id, title: 'Confirm', message: '', onCancel: noop, onConfirm: noop })
const detail = (meme = paperMeme): MemeDetailModel => ({
  id: meme.id, title: meme.title, private: !!meme.private, tierKey: meme.tier.key, tierName: meme.tier.name,
  tierLine: copy.hero.tierLine(meme.tier.name, meme.reshareCount ?? 0),
  tierLabel: copy.hero.tierLabel(meme.tier.name, meme.tier.rarity), tierHype: meme.tier.hype,
  tierLadder: buildTierLadderModel(meme.tier.key, meme.views ?? meme.reshares),
  card: buildMemeCardModel(meme), creatorLinkProps: { to: `/u/${meme.creatorId}` }, creatorName: meme.creatorName, ownerLinkProps: { to: `/u/${meme.ownerId}` }, ownerName: meme.ownerName, tagsLabel: null, viewsLabel: String(meme.views ?? meme.reshares), resharesLabel: String(meme.reshareCount ?? 0), viewsWord: copy.stats.viewsWord(meme.views ?? meme.reshares), resharesWord: copy.stats.resharesWord(meme.reshareCount ?? 0), valueLabel: String(meme.value), statsSrLabel: copy.stats.srLabel(meme.views ?? meme.reshares, meme.reshareCount ?? 0), valueSrLabel: copy.stats.valueSrLabel(meme.value), holdingsLabel: '100/100', shareInputProps: { value: `https://memeon.ai/m/${meme.id}`, readOnly: true, 'aria-label': copy.share.inputLabel }, copyButtonLabel: copy.share.copy, copyButtonProps: { onClick: noop }, previewLinkProps: { href: `/api/memes/${meme.id}/og.png`, target: '_blank', rel: 'noreferrer' }, signedOut: null, actions: [], notice: null, noticeProps: { role: 'status', 'aria-live': 'polite' }, error: null, errorProps: { role: 'alert', 'aria-live': 'assertive' }, listing: null,
  list: { show: true, disabledReason: null, sharesInputProps: { value: 10, min: 1, max: 100, step: 1, onChange: noop }, priceInputProps: { value: 1, min: .01, step: .01, onChange: noop }, listButtonLabel: copy.list.submit, listButtonProps: { onClick: noop, disabled: false, 'aria-busy': false } }, sources: [], plex: buildMemeplexPanelModel({ meme, plex: memeplexFamily, canEdit: true, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }), capTableTitle: copy.capTable.title, capTableNote: null, capTable: [{ userId: 'me', label: copy.holder.you, sharesLabel: '100/100' }], deleteDialog: buildConfirmDialogModel({ open: false, id: 'delete-meme', title: copy.deleteDialog.title, message: 'This cannot be undone.', danger: true, onCancel: noop, onConfirm: noop }), buyDialog: closedDialog('buy-shares'), claimDialog: closedDialog('claim-meme'),
})
/** the mocked listing every listed story shares: 10 shares at 🧠 4, a viewer holding 🧠 240 */
const LISTED_SHARES = 10
const LISTED_PRICE = 4
const VIEWER_COINS = 240
const listingModel = (overrides: Partial<DetailListingModel> = {}): DetailListingModel => ({
  saleLabel: copy.listing.sale(LISTED_SHARES, LISTED_PRICE), sharesLabel: copy.listing.shares(LISTED_SHARES), priceLabel: copy.listing.price(LISTED_PRICE), showBuy: true, showUnlist: false,
  buyLabel: copy.listing.buyInputLabel, balanceLabel: copy.listing.balance(VIEWER_COINS), disabledReason: null,
  buyInputProps: { value: 2, min: 1, max: LISTED_SHARES, step: 1, onChange: noop },
  buyButtonLabel: copy.listing.buyFor(2 * LISTED_PRICE), buyButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  unlistButtonLabel: copy.listing.unlist, unlistButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  ...overrides,
})
const listed = (overrides: Partial<DetailListingModel> = {}): MemeDetailModel => {
  const base = detail(listedHolo)
  const listing = listingModel(overrides)
  return {
    ...base, list: { ...base.list, show: false }, holdingsLabel: null,
    capTable: [{ userId: 'seller', label: 'lou', sharesLabel: '100/100' }],
    capTableNote: copy.capTable.note(LISTED_SHARES, 'lou'), listing,
    // the hero's "for sale" badge mirrors this mocked listing price, not listedHolo's own
    card: { ...base.card, listing: { ...base.card.listing!, sharesLabel: '10 sh @ 🧠4' } },
  }
}
/** the visitor block as the hook builds it for a card with no listing to lead with */
const signedOut: DetailSignedOutModel = {
  title: copy.signedOut.title, body: copy.signedOut.body,
  loginLabel: copy.signedOut.login,
  loginButtonProps: { onClick: noop, disabled: false, 'aria-busy': false, 'aria-label': copy.signedOut.loginLabel },
  browseLinkProps: { to: '/marketplace' }, browseLabel: copy.signedOut.browse, error: null, errorProps: { role: 'alert' },
}
const base: MemeDetailScreenModel = {
  phase: 'ready', showNotFound: false, showLoading: false,
  notFound: { message: copy.notFound.message, linkProps: { to: '/marketplace' }, linkLabel: copy.notFound.browse },
  loadingLabel: copy.loading,
  detail: detail(),
}
const meta = { title: 'Screens/MemeDetailScreen', component: MemeDetailScreen, args: base, decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>] } satisfies Meta<typeof MemeDetailScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = { args: { phase: 'loading', showLoading: true, detail: null } }
export const Empty: Story = { args: { phase: 'empty', showNotFound: true, detail: null } }
export const Error: Story = { args: { phase: 'error', detail: { ...detail(), error: copy.errors.action } } }
export const Ready: Story = {}
export const Notice: Story = { args: { detail: { ...detail(), notice: copy.toasts.listed } } }

/** The share-link arrival: no session, so the card sells the login instead of dead-ending. */
export const Visitor: Story = {
  args: {
    detail: {
      ...detail(), holdingsLabel: null, actions: [], list: { ...detail().list, show: false },
      plex: buildMemeplexPanelModel({ meme: paperMeme, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }),
      capTable: [{ userId: 'someone', label: copy.holder.unknown, sharesLabel: '100/100' }],
      signedOut,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.signedOut.loginLabel })).toBeVisible()
    await expect(canvas.getByRole('link', { name: copy.signedOut.browse })).toBeVisible()
  },
}
export const VisitorListed: Story = {
  args: {
    detail: {
      ...listed({ showBuy: false, balanceLabel: null }), holdingsLabel: null,
      plex: buildMemeplexPanelModel({ meme: listedHolo, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }),
      signedOut,
    },
  },
}

export const Listing: Story = { args: { phase: 'listing', detail: { ...detail(), list: { ...detail().list, listButtonLabel: copy.list.submitting, listButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } } } } }
export const ListOverHoldings: Story = { args: { detail: { ...detail(), holdingsLabel: '40/100', list: { ...detail().list, disabledReason: copy.list.onlyHold(40), sharesInputProps: { value: 60, min: 1, max: 40, step: 1, onChange: noop }, listButtonProps: { onClick: noop, disabled: true, 'aria-busy': false } } } } }
export const Buying: Story = {
  args: { phase: 'buying', detail: listed({ buyButtonLabel: copy.listing.buying, buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('spinbutton', { name: copy.listing.buyInputLabel })).toHaveAttribute('max', String(LISTED_SHARES))
    await expect(canvas.getByRole('button', { name: copy.listing.buying })).toBeDisabled()
  },
}
export const InsufficientBalance: Story = {
  args: { detail: listed({ balanceLabel: copy.listing.balance(3), disabledReason: copy.listing.short(5), buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': false } }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.listing.buyFor(2 * LISTED_PRICE) })).toBeDisabled()
    await expect(canvas.getByText(copy.listing.short(5))).toBeVisible()
  },
}
export const Unlisting: Story = { args: { phase: 'listing', detail: listed({ showBuy: false, showUnlist: true, unlistButtonLabel: copy.listing.unlisting, unlistButtonProps: { onClick: noop, disabled: true, 'aria-busy': true } }) } }

/** Restating an irreversible spend before it leaves the wallet. */
export const ConfirmBuy: Story = {
  args: {
    detail: {
      ...listed({ buyInputProps: { value: LISTED_SHARES, min: 1, max: LISTED_SHARES, step: 1, onChange: noop }, buyButtonLabel: copy.listing.buyFor(LISTED_SHARES * LISTED_PRICE) }),
      buyDialog: buildConfirmDialogModel({ open: true, id: 'buy-shares', title: copy.buyDialog.title(LISTED_SHARES * LISTED_PRICE), message: <>{copy.buyDialog.lead(LISTED_SHARES)}<strong>{copy.quotedTitle(listedHolo.title)}</strong>{copy.buyDialog.tail(LISTED_PRICE, VIEWER_COINS)}</>, confirmLabel: copy.buyDialog.confirm(LISTED_SHARES), onCancel: noop, onConfirm: noop }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alertdialog', { name: copy.buyDialog.title(LISTED_SHARES * LISTED_PRICE) })).toBeVisible()
  },
}

/** The archive claim, in the app's own dialog instead of window.prompt(). */
export const ClaimPrompt: Story = {
  args: {
    detail: {
      ...detail(),
      actions: [{ label: copy.actions.claim, buttonProps: { onClick: noop } }],
      claimDialog: buildConfirmDialogModel({
        open: true, id: 'claim-meme', title: copy.claimDialog.title,
        message: copy.claimDialog.body,
        confirmLabel: copy.claimDialog.confirm,
        prompt: { label: copy.claimDialog.prompt.label, value: '', placeholder: copy.claimDialog.prompt.placeholder, maxLength: 400, hint: copy.claimDialog.prompt.hint, onChange: noop },
        onCancel: noop, onConfirm: noop,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: copy.claimDialog.prompt.label })).toBeVisible()
  },
}

export const Deleting: Story = {
  args: (() => {
    const onCancel = fn()
    return {
      phase: 'deleting' as const,
      detail: {
        ...detail(),
        deleteDialog: buildConfirmDialogModel({ open: true, id: 'delete-meme', title: copy.deleteDialog.title, message: 'This cannot be undone.', danger: true, busy: true, onCancel, onConfirm: noop }),
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
      viewsWord: copy.stats.viewsWord(1), resharesWord: copy.stats.resharesWord(1),
      statsSrLabel: copy.stats.srLabel(1, 1),
      card: { ...detail().card, viewsLabel: '1', resharesLabel: '1', statsA11yLabel: '1 views, 1 reshares' },
    },
  },
}

/** A card one rung from the top: the ladder states the next threshold instead of implying it. */
export const TierLadderMaxed: Story = {
  args: { detail: { ...detail(), tierKey: 'shiny', tierName: 'Shiny', tierLabel: 'Shiny · Mythic Shiny', tierLadder: buildTierLadderModel('shiny', 41_000), viewsLabel: '41,000', statsSrLabel: copy.stats.srLabel(41_000, 900),
    card: { ...detail().card, tierKey: 'shiny', tierLabel: 'Shiny · Mythic Shiny', viewsLabel: '41,000' } } },
}
export const CapTableUnresolved: Story = {
  args: { detail: { ...detail(), holdingsLabel: '40/100', capTable: [{ userId: 'me', label: 'You', sharesLabel: '40/100' }, { userId: 'a', label: 'another collector', sharesLabel: '35/100' }, { userId: 'b', label: 'another collector', sharesLabel: '25/100' }] } },
}

/** Spread sources card: where the link actually travelled. */
const sources = [
  { id: 'group chat', label: 'group chat', viewsLabel: '8,600' },
  { id: 'the void subreddit', label: 'the void subreddit', viewsLabel: '5,920', linkProps: { href: 'https://example.com/r/void', target: '_blank' as const, rel: 'noreferrer' as const } },
  { id: 'work discord', label: 'work discord', viewsLabel: '4,380' },
]

/** Everything a holder of all 100 shares can do: list, make private, delete forever. */
export const Owner: Story = {
  args: {
    detail: {
      ...detail(), sources,
      actions: [
        { label: '🧬 Create a meme from this', buttonProps: { onClick: noop } },
        { label: '🙈 Make private', buttonProps: { onClick: noop } },
        { label: '🗑️ Delete forever', variant: 'danger', buttonProps: { onClick: noop } },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /Delete forever/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'List' })).toBeEnabled()
    // tier line lives inside the hero card with the meter — signed-in and public views
    const hero = canvasElement.querySelector('[data-slot="detail-hero"]')!
    const card = hero.querySelector('[data-slot="meme-card"]')!
    const line = card.querySelector('[data-slot="detail-tier-line"]')
    await expect(line).toBeVisible()
    await expect(line).toHaveTextContent(`${paperMeme.tier.name} ·`)
    await expect(line).toHaveTextContent(/reshare/)
    await expect(card.querySelector('[data-slot="tier-progression"]')).not.toBeNull()
    await expect(hero.querySelectorAll('[data-slot="meme-card"]')).toHaveLength(1)
  },
}

/** The public share view: the meme's own name is the H1 and Masky is the single bubblegum. */
export const LoggedOut: Story = {
  args: {
    detail: {
      ...listed({ showBuy: false, balanceLabel: null }), holdingsLabel: null, sources,
      plex: buildMemeplexPanelModel({ meme: listedHolo, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, error: null, onPickChange: noop, onPastedChange: noop, onAdd: noop }),
      capTable: [{ userId: 'a', label: 'oxfern', sharesLabel: '48/100' }, { userId: 'b', label: 'masky.moth', sharesLabel: '28/100' }, { userId: 'c', label: 'meme.custodian', sharesLabel: '24/100' }],
      signedOut: {
        title: 'Own a piece of this',
        body: copy.signedOut.body,
        loginLabel: '🎭 Log in with Masky',
        loginButtonProps: { onClick: noop, disabled: false, 'aria-busy': false, 'aria-label': 'Log in with Masky' },
        browseLinkProps: { to: '/marketplace' }, browseLabel: 'Browse the marketplace', error: null, errorProps: { role: 'alert' },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: listedHolo.title })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Log in with Masky' })).toBeVisible()
    await expect(canvas.queryByText(/listed at/)).toBeNull()
    await expect(canvas.getByText('for sale')).toBeVisible()
    // public view: tier line uses link colour inside the hero card
    const lines = canvasElement.querySelectorAll('[data-slot="detail-tier-line"]')
    await expect(lines).toHaveLength(1)
    await expect(lines[0]!.closest('[data-slot="meme-card"]')).not.toBeNull()
  },
}

export const Dark: Story = { args: Owner.args, globals: { theme: 'dark' } }

/** 390×844: one column — hero and ladder, then the rail's cards at the 20px margin. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

export const Phone390: Story = { args: Owner.args, ...phone }

export const DarkPhone390: Story = {
  args: Owner.args,
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const LoggedOutPhone390: Story = { args: LoggedOut.args, ...phone }
