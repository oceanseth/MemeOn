import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { listedHolo, memeplexFamily, paperMeme } from '../../.storybook/fixtures'
import { memeDetailCopy as copy } from '../copy/memeDetail'
import { memeplexPanelCopy } from '../copy/memeplexPanel'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { humanize } from '../lib/humanize'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { memeReshareCount, memeViewCount } from '../lib/memeMetrics'
import { buildMemeplexPanelModel } from '../lib/memeplexPanelModel'
import {
  buildTierLadderModel,
  type DetailListingModel,
  type DetailSignedOutModel,
  type MemeDetailModel,
  type MemeDetailScreenModel,
} from '../lib/memeDetailModel'
import { MemeDetailScreen } from './MemeDetailScreen'

const noop = fn()
const closedDialog = (id: string) =>
  buildConfirmDialogModel({
    open: false,
    id,
    title: 'Confirm',
    message: '',
    onCancel: noop,
    onConfirm: noop,
  })
const detail = (meme = paperMeme): MemeDetailModel => {
  const views = memeViewCount(meme)
  const reshareCount = memeReshareCount(meme)
  return {
    id: meme.id,
    title: meme.title,
    private: !!meme.private,
    tierKey: meme.tier.key,
    tierName: meme.tier.name,
    tierLine: copy.hero.tierLine(meme.tier.name, reshareCount),
    tierLabel: copy.hero.tierLabel(meme.tier.name, meme.tier.rarity),
    tierHype: meme.tier.hype,
    tierLadder: buildTierLadderModel(meme.tier.key, views),
    card: buildMemeCardModel(meme),
    creatorLinkProps: { to: `/u/${meme.creatorId}` },
    creatorName: meme.creatorName,
    ownerLinkProps: { to: `/u/${meme.ownerId}` },
    ownerName: meme.ownerName,
    tagsLabel: null,
    viewsLabel: String(views),
    resharesLabel: String(reshareCount),
    viewsWord: copy.stats.viewsWord(views),
    resharesWord: copy.stats.resharesWord(reshareCount),
    valueLabel: String(meme.value),
    statsSrLabel: copy.stats.srLabel(views, reshareCount),
    valueSrLabel: copy.stats.valueSrLabel(meme.value),
    holdingsLabel: copy.provenance.holdings(100),
    shareTitle: copy.share.title,
    shareCaption: copy.share.caption,
    previewLabel: copy.share.preview,
    shareInputProps: {
      value: `https://memeon.ai/m/${meme.id}`,
      readOnly: true,
      'aria-label': copy.share.inputLabel,
    },
    copyDone: false,
    copyButtonLabel: copy.share.copy,
    copyButtonProps: { onClick: noop },
    previewLinkProps: {
      href: `/api/memes/${meme.id}/og.png`,
      target: '_blank',
      rel: 'noreferrer',
    },
    signedOut: null,
    actions: [],
    controlsTitle: copy.controls.title,
    controlsCaption: copy.controls.caption,
    spreadingTitle: copy.spreading.title,
    provenanceMintedBy: copy.provenance.mintedBy,
    provenanceOwnedBy: copy.provenance.ownedBy,
    provenanceRemix: copy.provenance.remix,
    provenanceYouHold: copy.provenance.youHold,
    provenanceSeparator: copy.provenance.separator,
    privateBadgeLabel: copy.privateBadge,
    notice: null,
    noticeProps: { role: 'status', 'aria-live': 'polite' },
    error: null,
    errorProps: { role: 'alert', 'aria-live': 'assertive' },
    listing: null,
    list: {
      show: true,
      panelTitle: copy.list.panelTitle,
      panelCaption: copy.list.panelCaption,
      sharesFieldLabel: copy.list.sharesField,
      perShareLabel: copy.list.perShare,
      priceSrLabel: copy.list.priceSr,
      disabledReason: null,
      sharesInputProps: {
        value: 10,
        min: 1,
        max: 100,
        step: 1,
        onChange: noop,
      },
      priceInputProps: { value: 1, min: 0.01, step: 0.01, onChange: noop },
      listButtonLabel: copy.list.submit,
      listButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
    },
    sources: [],
    plex: buildMemeplexPanelModel({
      meme,
      plex: memeplexFamily,
      canEdit: true,
      binder: [],
      pick: '',
      pasted: '',
      notice: null,
      error: null,
      onPickChange: noop,
      onPastedChange: noop,
      onAdd: noop,
    }),
    capTableTitle: copy.capTable.title,
    capTableNote: null,
    capTable: [{ userId: 'me', label: copy.holder.you, sharesLabel: copy.capTable.shares(100) }],
    deleteDialog: buildConfirmDialogModel({
      open: false,
      id: 'delete-meme',
      title: copy.deleteDialog.title,
      message: 'This cannot be undone.',
      danger: true,
      onCancel: noop,
      onConfirm: noop,
    }),
    buyDialog: closedDialog('buy-shares'),
    claimDialog: closedDialog('claim-meme'),
  }
}
/** the mocked listing every listed story shares: 10 shares at 4 braincells, a viewer holding 240 braincells */
const LISTED_SHARES = 10
const LISTED_PRICE = 4
const VIEWER_COINS = 240
const listingModel = (overrides: Partial<DetailListingModel> = {}): DetailListingModel => ({
  saleLabel: copy.listing.sale(LISTED_SHARES, LISTED_PRICE),
  sharesLabel: copy.listing.shares(LISTED_SHARES),
  priceLabel: copy.listing.price(LISTED_PRICE),
  showBuy: true,
  showUnlist: false,
  buyLabel: copy.listing.buyInputLabel,
  balanceLabel: copy.listing.balance(VIEWER_COINS),
  disabledReason: null,
  buyInputProps: {
    value: 2,
    min: 1,
    max: LISTED_SHARES,
    step: 1,
    onChange: noop,
  },
  buyButtonLabel: copy.listing.buyFor(2 * LISTED_PRICE),
  buyButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  unlistButtonLabel: copy.listing.unlist,
  unlistButtonProps: { onClick: noop, disabled: false, 'aria-busy': false },
  ...overrides,
})
const listed = (overrides: Partial<DetailListingModel> = {}): MemeDetailModel => {
  const base = detail(listedHolo)
  const listing = listingModel(overrides)
  return {
    ...base,
    list: { ...base.list, show: false },
    holdingsLabel: null,
    capTable: [{ userId: 'seller', label: 'lou', sharesLabel: copy.capTable.shares(100) }],
    capTableNote: copy.capTable.note(LISTED_SHARES, 'lou'),
    listing,
    // the hero's "for sale" badge mirrors this mocked listing price, not listedHolo's own
    card: {
      ...base.card,
      listing: { ...base.card.listing!, sharesLabel: '10 sh @ 4 braincells' },
    },
  }
}
/** the visitor block as the hook builds it for a card with no listing to lead with */
const signedOut: DetailSignedOutModel = {
  title: copy.signedOut.title,
  body: copy.signedOut.body,
  loginLabel: copy.signedOut.login,
  loginButtonProps: {
    onClick: noop,
    disabled: false,
    'aria-busy': false,
    'aria-label': copy.signedOut.loginLabel,
  },
  browseLinkProps: { to: '/marketplace' },
  browseLabel: copy.signedOut.browse,
  error: null,
  errorProps: { role: 'alert' },
}
const base: MemeDetailScreenModel = {
  phase: 'ready',
  showNotFound: false,
  showLoading: false,
  notFound: {
    title: copy.notFound.title,
    message: copy.notFound.message,
    linkProps: { to: '/marketplace' },
    linkLabel: copy.notFound.browse,
  },
  loadingLabel: copy.loading,
  detail: detail(),
}
const meta = {
  title: 'Screens/MemeDetailScreen',
  component: MemeDetailScreen,
  args: base,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeDetailScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = {
  args: { phase: 'loading', showLoading: true, detail: null },
}
export const Empty: Story = {
  args: { phase: 'empty', showNotFound: true, detail: null },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { name: copy.notFound.title }),
    ).toBeVisible()
    await expect(within(canvasElement).getByText(copy.notFound.message)).toBeVisible()
  },
}
export const Error: Story = {
  args: { phase: 'error', detail: { ...detail(), error: copy.errors.action } },
}
export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: copy.share.title })).toBeVisible()
    await expect(canvas.getByText(copy.share.caption)).toBeVisible()
  },
}
export const Notice: Story = {
  args: { detail: { ...detail(), notice: copy.toasts.listed } },
}
export const Copied: Story = {
  args: {
    detail: { ...detail(), copyDone: true, copyButtonLabel: copy.share.copied },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: copy.share.copied })
    await expect(button).toBeVisible()
    const icon = button.querySelector('[data-slot="icon"]')
    await expect(icon).not.toBeNull()
    await expect(
      icon!.querySelector('path[d*="M7.757 12L10.409 14.652L16.243 8.818"]'),
    ).not.toBeNull()
  },
}
export const CopyFailed: Story = {
  args: { detail: { ...detail(), copyButtonLabel: copy.share.copyFailed } },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', {
        name: copy.share.copyFailed,
      }),
    ).toBeVisible()
  },
}
export const PlexLoadFailed: Story = {
  args: {
    detail: {
      ...detail(),
      plex: buildMemeplexPanelModel({
        meme: paperMeme,
        plex: null,
        canEdit: true,
        binder: [],
        pick: '',
        pasted: '',
        notice: null,
        error: copy.memeplex.loadFailed,
        onPickChange: noop,
        onPastedChange: noop,
        onAdd: noop,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.memeplex.loadFailed)).toBeVisible()
    await expect(canvas.queryByText(memeplexPanelCopy.empty)).toBeNull()
  },
}

/** The share-link arrival: no session, so the card sells the login instead of dead-ending. */
export const Visitor: Story = {
  args: {
    detail: {
      ...detail(),
      holdingsLabel: null,
      actions: [],
      list: { ...detail().list, show: false },
      plex: buildMemeplexPanelModel({
        meme: paperMeme,
        plex: memeplexFamily,
        canEdit: false,
        binder: [],
        pick: '',
        pasted: '',
        notice: null,
        error: null,
        onPickChange: noop,
        onPastedChange: noop,
        onAdd: noop,
      }),
      capTable: [
        {
          userId: 'someone',
          label: copy.holder.unknown,
          sharesLabel: copy.capTable.shares(100),
        },
      ],
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
      ...listed({ showBuy: false, balanceLabel: null }),
      holdingsLabel: null,
      plex: buildMemeplexPanelModel({
        meme: listedHolo,
        plex: memeplexFamily,
        canEdit: false,
        binder: [],
        pick: '',
        pasted: '',
        notice: null,
        error: null,
        onPickChange: noop,
        onPastedChange: noop,
        onAdd: noop,
      }),
      signedOut,
    },
  },
}

export const Listing: Story = {
  args: {
    phase: 'listing',
    detail: {
      ...detail(),
      list: {
        ...detail().list,
        listButtonLabel: copy.list.submitting,
        listButtonProps: { onClick: noop, disabled: true, 'aria-busy': true },
      },
    },
  },
}
export const ListOverHoldings: Story = {
  args: {
    detail: {
      ...detail(),
      holdingsLabel: copy.provenance.holdings(40),
      list: {
        ...detail().list,
        disabledReason: copy.list.onlyHold(40),
        sharesInputProps: {
          value: 60,
          min: 1,
          max: 40,
          step: 1,
          onChange: noop,
        },
        listButtonProps: { onClick: noop, disabled: true, 'aria-busy': false },
      },
    },
  },
}
export const Buying: Story = {
  args: {
    phase: 'buying',
    detail: listed({
      buyButtonLabel: copy.listing.buying,
      buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': true },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('spinbutton', { name: copy.listing.buyInputLabel }),
    ).toHaveAttribute('max', String(LISTED_SHARES))
    await expect(canvas.getByRole('button', { name: copy.listing.buying })).toBeDisabled()
  },
}
export const InsufficientBalance: Story = {
  args: {
    detail: listed({
      balanceLabel: copy.listing.balance(3),
      disabledReason: copy.listing.short(5),
      buyButtonProps: { onClick: noop, disabled: true, 'aria-busy': false },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', {
        name: copy.listing.buyFor(2 * LISTED_PRICE),
      }),
    ).toBeDisabled()
    await expect(canvas.getByText(copy.listing.short(5))).toBeVisible()
  },
}
export const Unlisting: Story = {
  args: {
    phase: 'listing',
    detail: listed({
      showBuy: false,
      showUnlist: true,
      unlistButtonLabel: copy.listing.unlisting,
      unlistButtonProps: { onClick: noop, disabled: true, 'aria-busy': true },
    }),
  },
}

/** Restating an irreversible spend before it leaves the wallet. */
export const ConfirmBuy: Story = {
  args: {
    detail: {
      ...listed({
        buyInputProps: {
          value: LISTED_SHARES,
          min: 1,
          max: LISTED_SHARES,
          step: 1,
          onChange: noop,
        },
        buyButtonLabel: copy.listing.buyFor(LISTED_SHARES * LISTED_PRICE),
      }),
      buyDialog: buildConfirmDialogModel({
        open: true,
        id: 'buy-shares',
        title: copy.buyDialog.title(LISTED_SHARES * LISTED_PRICE),
        message: [
          copy.buyDialog.lead(LISTED_SHARES),
          { kind: 'strong' as const, text: copy.quotedTitle(listedHolo.title) },
          copy.buyDialog.tail(LISTED_PRICE, VIEWER_COINS),
        ],
        confirmLabel: copy.buyDialog.confirm(LISTED_SHARES),
        onCancel: noop,
        onConfirm: noop,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog', {
      name: copy.buyDialog.title(LISTED_SHARES * LISTED_PRICE),
    })
    await expect(dialog).toBeVisible()
    await expect(dialog.querySelector('strong')).toHaveTextContent(
      copy.quotedTitle(listedHolo.title),
    )
    await expect(dialog).toHaveTextContent(copy.buyDialog.lead(LISTED_SHARES).trim())
    await expect(dialog).toHaveTextContent(copy.buyDialog.tail(LISTED_PRICE, VIEWER_COINS).trim())
  },
}

/** The archive claim, in the app's own dialog instead of window.prompt(). */
export const ClaimPrompt: Story = {
  args: {
    detail: {
      ...detail(),
      actions: [
        {
          label: copy.actions.claim,
          icon: 'film',
          buttonProps: { onClick: noop },
        },
      ],
      claimDialog: buildConfirmDialogModel({
        open: true,
        id: 'claim-meme',
        title: copy.claimDialog.title,
        message: copy.claimDialog.body,
        confirmLabel: copy.claimDialog.confirm,
        prompt: {
          label: copy.claimDialog.prompt.label,
          value: '',
          placeholder: copy.claimDialog.prompt.placeholder,
          maxLength: 400,
          hint: copy.claimDialog.prompt.hint,
          onChange: noop,
        },
        onCancel: noop,
        onConfirm: noop,
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
        deleteDialog: buildConfirmDialogModel({
          open: true,
          id: 'delete-meme',
          title: copy.deleteDialog.title,
          message: [
            {
              kind: 'strong' as const,
              text: copy.quotedTitle(paperMeme.title),
            },
            copy.deleteDialog.body,
          ],
          danger: true,
          busy: true,
          onCancel,
          onConfirm: noop,
        }),
      },
    }
  })(),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.querySelector('strong')).toHaveTextContent(
      copy.quotedTitle(paperMeme.title),
    )
    await expect(dialog).toHaveTextContent(copy.deleteDialog.body.trim())
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
      card: {
        ...detail().card,
        media: {
          kind: 'image',
          backdropImageProps: {
            src: WIDE_ART,
            alt: '',
            'aria-hidden': true,
            loading: 'lazy',
          },
          imageProps: {
            src: WIDE_ART,
            alt: 'MY IDEA / MY IDEA AFTER ASKING CHATGPT',
            loading: 'eager',
          },
        },
      },
    },
  },
}

/** One view, one reshare: the nouns agree with the figures instead of reading "1 reshares". */
export const SingleReshare: Story = {
  args: {
    detail: {
      ...detail(),
      viewsLabel: '1',
      resharesLabel: '1',
      viewsWord: copy.stats.viewsWord(1),
      resharesWord: copy.stats.resharesWord(1),
      statsSrLabel: copy.stats.srLabel(1, 1),
      card: {
        ...detail().card,
        viewsLabel: '1',
        resharesLabel: '1',
        statsA11yLabel: '1 view, 1 reshare',
      },
    },
  },
}

/** A card one rung from the top: the ladder states the next threshold instead of implying it. */
export const TierLadderMaxed: Story = {
  args: {
    detail: {
      ...detail(),
      tierKey: 'shiny',
      tierName: 'Shiny',
      tierLabel: 'Shiny · Mythic Shiny',
      tierLadder: buildTierLadderModel('shiny', 41_000),
      viewsLabel: humanize(41_000),
      statsSrLabel: copy.stats.srLabel(41_000, 900),
      card: {
        ...detail().card,
        tierKey: 'shiny',
        tierLabel: 'Shiny · Mythic Shiny',
        viewsLabel: humanize(41_000),
      },
    },
  },
}
export const CapTableUnresolved: Story = {
  args: {
    detail: {
      ...detail(),
      holdingsLabel: copy.provenance.holdings(40),
      capTable: [
        { userId: 'me', label: 'You', sharesLabel: copy.capTable.shares(40) },
        { userId: 'a', label: 'another collector', sharesLabel: copy.capTable.shares(35) },
        { userId: 'b', label: 'another collector', sharesLabel: copy.capTable.shares(25) },
      ],
    },
  },
}

/** Spread sources card: where the link actually travelled. */
const sources = [
  { id: 'group chat', label: 'group chat', viewsLabel: humanize(8_600) },
  {
    id: 'the void subreddit',
    label: 'the void subreddit',
    viewsLabel: humanize(5_920),
    linkProps: {
      href: 'https://example.com/r/void',
      target: '_blank' as const,
      rel: 'noreferrer' as const,
    },
  },
  { id: 'work discord', label: 'work discord', viewsLabel: humanize(4_380) },
]

/** Everything a holder of all 100 shares can do: list, make private, delete forever. */
const ownerArgs: Story['args'] = {
  detail: {
    ...detail(),
    sources,
    actions: [
      {
        label: 'Create a meme from this',
        icon: 'dna',
        buttonProps: { onClick: noop },
      },
      {
        label: 'Make private',
        icon: 'eye-off',
        buttonProps: { onClick: noop },
      },
      {
        label: 'Delete forever',
        icon: 'trash-2',
        variant: 'destructive',
        buttonProps: { onClick: noop },
      },
    ],
  },
}

export const Owner: Story = {
  args: ownerArgs,
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
    // the ladder meter is the Progress atom wearing the gradient fill, not an inline width
    const meter = card.querySelector('[data-slot="progress"]')!
    await expect(meter).toHaveAttribute('role', 'progressbar')
    await expect(meter.querySelector('[data-slot="progress-indicator"]')).toHaveAttribute(
      'data-variant',
      'ladder',
    )
    // every rail panel is a Card with a CardTitle, and the delete action is the destructive pill
    await expect(canvasElement.querySelectorAll('[data-slot="card-title"]').length).toBeGreaterThan(
      3,
    )
    await expect(hero.querySelectorAll('[data-slot="meme-card"]')).toHaveLength(1)
    await expect(canvasElement.querySelector('[data-slot="page-head"]')).toBeNull()
    await expect(canvasElement.querySelector('[data-slot="detail-metadata"]')).toBeNull()
    const provenance = canvasElement.querySelector('[data-slot="detail-provenance"]')
    await expect(provenance).not.toBeNull()
    await expect(provenance!.closest('[data-slot="detail-rail"]')).not.toBeNull()
    await expect(
      canvas
        .getByRole('heading', { level: 1, name: paperMeme.title })
        .closest('[data-slot="meme-card"]'),
    ).not.toBeNull()
  },
}

/** The public share view: the card title is the H1 and Masky is the single bubblegum. */
const loggedOutArgs = {
  detail: {
    ...listed({ showBuy: false, balanceLabel: null }),
    holdingsLabel: null,
    sources,
    plex: buildMemeplexPanelModel({
      meme: listedHolo,
      plex: memeplexFamily,
      canEdit: false,
      binder: [],
      pick: '',
      pasted: '',
      notice: null,
      error: null,
      onPickChange: noop,
      onPastedChange: noop,
      onAdd: noop,
    }),
    capTable: [
      { userId: 'a', label: 'oxfern', sharesLabel: copy.capTable.shares(48) },
      { userId: 'b', label: 'masky.moth', sharesLabel: copy.capTable.shares(28) },
      { userId: 'c', label: 'meme.custodian', sharesLabel: copy.capTable.shares(24) },
    ],
    signedOut: {
      title: 'Own a piece of this',
      body: copy.signedOut.body,
      loginLabel: 'Log in with Masky',
      loginButtonProps: {
        onClick: noop,
        disabled: false,
        'aria-busy': false,
        'aria-label': 'Log in with Masky',
      },
      browseLinkProps: { to: '/marketplace' },
      browseLabel: 'Browse the marketplace',
      error: null,
      errorProps: { role: 'alert' },
    },
  },
}

export const LoggedOut: Story = {
  args: loggedOutArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: listedHolo.title })).toBeVisible()
    await expect(
      canvas
        .getByRole('heading', { level: 1, name: listedHolo.title })
        .closest('[data-slot="meme-card"]'),
    ).not.toBeNull()
    await expect(canvasElement.querySelector('[data-slot="page-head"]')).toBeNull()
    await expect(canvasElement.querySelector('[data-slot="detail-metadata"]')).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Log in with Masky' })).toBeVisible()
    await expect(canvas.queryByText(/listed at/)).toBeNull()
    await expect(canvas.getByText('for sale')).toBeVisible()
    // public view: tier line uses link colour inside the hero card
    const lines = canvasElement.querySelectorAll('[data-slot="detail-tier-line"]')
    await expect(lines).toHaveLength(1)
    await expect(lines[0]!.closest('[data-slot="meme-card"]')).not.toBeNull()
    const provenance = canvasElement.querySelector('[data-slot="detail-provenance"]')
    await expect(provenance).not.toBeNull()
    await expect(provenance!.closest('[data-slot="detail-rail"]')).not.toBeNull()
  },
}

export const Dark: Story = { args: ownerArgs, globals: { theme: 'dark' } }

/** 390×844: one column — hero card first, then the rail, provenance at the bottom. */
const phone = {
  parameters: {
    viewport: {
      options: {
        phone390: {
          name: 'Phone 390',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

export const Phone390: Story = { args: ownerArgs, ...phone }

export const DarkPhone390: Story = {
  args: ownerArgs,
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const LoggedOutPhone390: Story = { args: loggedOutArgs, ...phone }
