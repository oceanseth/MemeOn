import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, screen, userEvent, within } from 'storybook/test'
import { MemoryRouter } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import { friendAccepted, giftablePaper, meLou, paperMeme, proposedTrade, silverMeme } from '../../.storybook/fixtures'
import { tradesCopy as copy } from '../copy/trades'
import type { TradeComposerModel, TradesScreenModel } from '../hooks/useTradesScreen'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildTradeCardModel, tradeSideSentence, type TradeMemeInfoMap } from '../lib/tradeCardModel'
import { TradesScreen } from './TradesScreen'

const noop = fn()
/** The Base UI trigger opens a portalled listbox, so the option is picked from `screen`. */
async function pickOption(trigger: HTMLElement, optionName: string): Promise<void> {
  await userEvent.click(trigger)
  const listbox = await screen.findByRole('listbox')
  // the popup mounts before its options paint, so the option is awaited too, never sampled
  await userEvent.click(await within(listbox).findByRole('option', { name: optionName }))
}
const composerActions = {
  friend: fn(), offerMeme: fn(), offerShares: fn(), offerCoins: fn(), askMeme: fn(), askShares: fn(), askCoins: fn(), propose: fn(), submit: fn(),
}
// story-local: a fixed clock so the relative timestamps render the same on every run
const NOW = new Date(proposedTrade.createdAt).getTime() + 3 * 60 * 60 * 1000
const memeNames: TradeMemeInfoMap = {
  [paperMeme.id]: { title: paperMeme.title, imageUrl: paperMeme.imageUrl, tierKey: 'paper', tierName: 'Paper', tierLabel: copy.memeTierLabel('Paper', 'common'), reshares: 0 },
  [silverMeme.id]: { title: silverMeme.title, imageUrl: silverMeme.imageUrl, tierKey: 'silver', tierName: 'Silver', tierLabel: copy.memeTierLabel('Silver', 'uncommon'), reshares: 12 },
}
const closedDialog = buildConfirmDialogModel({ open: false, title: '', message: '', onConfirm: noop, onCancel: noop })
const empty: TradesScreenModel = {
  phase: 'empty', pageTitle: copy.pageTitle, newTradeButtonLabel: copy.newTrade, newTradeButtonProps: { onClick: noop, 'aria-expanded': false, 'aria-controls': 'trade-composer' },
  compose: null, open: [], openCountLabel: null, history: [],
  msg: null, noticeProps: { role: 'status', 'aria-live': 'polite' },
  err: null, errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' }, showErrorNotice: false,
  showError: false, retryButtonProps: { onClick: noop }, retryLabel: copy.retry,
  showLoading: false, loadingProps: { role: 'status', 'aria-live': 'polite' }, loadingLabel: copy.loading,
  showLists: true, openHeading: copy.lists.openHeading, openEmptyMessage: copy.lists.openEmpty,
  historyHeading: copy.lists.historyHeading, historyEmptyMessage: copy.lists.historyEmpty,
  confirmDialog: closedDialog,
}
const compose: TradeComposerModel = {
  formProps: { id: 'trade-composer', onSubmit: (event) => { event.preventDefault(); composerActions.submit() } },
  noFriends: false,
  noFriendsMessage: copy.composer.noFriends,
  findFriendsLinkProps: { to: '/friends' },
  findFriendsLabel: copy.composer.findFriends,
  heading: copy.composer.heading,
  intro: copy.composer.intro,
  tradeWithLabel: copy.composer.tradeWith,
  friendSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.friend(value) },
  friendSelectItems: [{ value: '', label: copy.composer.pickFriend }, { value: friendAccepted.sub, label: friendAccepted.name }],
  youGiveLegend: copy.composer.youGiveLegend,
  youGiveBinderLabel: copy.composer.youGiveBinder,
  offerMemeSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.offerMeme(value) },
  offerMemeSelectItems: [{ value: '', label: copy.noMeme }, { value: giftablePaper.id, label: copy.composer.binderOption(giftablePaper.title, giftablePaper.myShares ?? 0) }],
  showOfferShares: true,
  sharesToGiveLabel: copy.composer.sharesToGive,
  offerSharesInputProps: { value: 5, min: 1, max: 12, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerShares(Number(event.target.value)) },
  offerSharesHint: copy.composer.offerSharesHint(12),
  braincellsAddLabel: copy.composer.braincellsAdd,
  offerCoinsInputProps: { value: 0, min: 0, max: meLou.coins, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerCoins(Number(event.target.value)) },
  offerCoinsHint: copy.composer.offerCoinsHint(meLou.coins),
  youWantLegend: copy.composer.youWantLegend,
  youWantMemesLabel: copy.composer.youWantMemes,
  askMemeSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.askMeme(value) },
  askMemeSelectItems: [{ value: '', label: copy.noMeme }, { value: silverMeme.id, label: silverMeme.title }],
  showAskShares: true,
  sharesToWantLabel: copy.composer.sharesToWant,
  askSharesInputProps: { value: 5, min: 1, max: 100, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askShares(Number(event.target.value)) },
  braincellsWantLabel: copy.composer.braincellsWant,
  askCoinsInputProps: { value: 0, min: 0, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askCoins(Number(event.target.value)) },
  proposeCaption: copy.composer.proposeCaption,
  error: null, errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' }, proposeButtonLabel: copy.newTrade, proposeButtonProps: { onClick: composerActions.propose, disabled: false },
}
const openTrade = buildTradeCardModel({ trade: proposedTrade, meSub: meLou.sub, memeNames, onRespond: noop, now: NOW })
const pastTrade = buildTradeCardModel({ trade: { ...proposedTrade, id: 'trade-accepted', status: 'accepted' }, meSub: meLou.sub, memeNames, now: NOW })
/** the 390 × 844 twin every screen in this swarm carries beside its desktop story */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/TradesScreen',
  component: TradesScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof TradesScreen>
export default meta
type Story = StoryObj<typeof meta>
/** skeleton rows keep the list's shape while GET /api/trades is in flight */
export const Loading: Story = { args: { phase: 'loading', showLoading: true, showLists: false } }
export const Empty: Story = {}
/** an action failed: red, announced, and the lists stay usable */
export const ActionError: Story = { args: { phase: 'error', err: copy.errors.respond, showErrorNotice: true, open: [openTrade] } }
/** the list itself never arrived: a retry, not a fake empty state */
export const LoadError: Story = { args: { phase: 'error', err: copy.errors.load, showError: true, showLists: false } }
export const Ready: Story = {
  args: { phase: 'ready', open: [openTrade], openCountLabel: copy.openCount(1), history: [pastTrade] },
  play: async ({ canvasElement }) => {
    // the region is mounted and silent before there is anything to announce (`empty:hidden`
    // keeps a silent region out of the a11y tree, so it is read by slot, not by role)
    await expect(canvasElement.querySelector('[data-slot="live-region"]')).toBeEmptyDOMElement()
    // each list is a Heading over a Toolbar row, and an empty list is the Empty card
    const heading = canvasElement.querySelector('[data-slot="heading"]')!
    await expect(heading.closest('[data-slot="toolbar"]')).not.toBeNull()
    await expect(heading).toHaveAttribute('data-size', 'title')
  },
}
/** the outcome of the app's most irreversible action, announced by a region that was already there */
export const Proposed: Story = {
  args: { phase: 'ready', msg: 'Trade proposed. It is on their table now.', open: [openTrade], openCountLabel: copy.openCount(1), history: [pastTrade] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Trade proposed.')
  },
}
export const Composing: Story = {
  args: { phase: 'composing', newTradeButtonLabel: copy.closeComposer, newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose },
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); /* the composer's two sides are field sets, the grid keeps them side by side by that slot */ await expect(canvasElement.querySelectorAll('[data-slot="field-set"]')).toHaveLength(2); await expect(canvasElement.querySelector('[data-slot="field-legend"]')).toHaveAttribute('data-variant', 'legend'); const selects = canvas.getAllByRole('combobox'); await pickOption(selects[0]!, friendAccepted.name); await pickOption(selects[1]!, copy.composer.binderOption(giftablePaper.title, giftablePaper.myShares ?? 0)); await pickOption(selects[2]!, silverMeme.title); const inputs = canvas.getAllByRole('spinbutton'); for (const [input, value] of [[inputs[0], '7'], [inputs[1], '12'], [inputs[2], '6'], [inputs[3], '8']] as const) await fireEvent.change(input!, { target: { value } }); await userEvent.click(canvas.getByRole('button', { name: copy.newTrade })); await expect(composerActions.friend).toHaveBeenCalledWith(friendAccepted.sub); await expect(composerActions.offerMeme).toHaveBeenCalledWith(giftablePaper.id); await expect(composerActions.askMeme).toHaveBeenCalledWith(silverMeme.id); await expect(composerActions.offerShares).toHaveBeenLastCalledWith(7); await expect(composerActions.offerCoins).toHaveBeenLastCalledWith(12); await expect(composerActions.askShares).toHaveBeenLastCalledWith(6); await expect(composerActions.askCoins).toHaveBeenLastCalledWith(8); await expect(composerActions.submit).toHaveBeenCalledOnce() },
}
/** nothing on either side: the button cannot post a nothing-for-nothing proposal */
export const ComposingEmptyProposal: Story = {
  args: { phase: 'composing', newTradeButtonLabel: copy.closeComposer, newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose: { ...compose, showOfferShares: false, showAskShares: false, proposeButtonProps: { onClick: composerActions.propose, disabled: true } } },
}
/** no accepted friends: the form has nothing to work with, so it says so */
export const ComposingNoFriends: Story = {
  args: { phase: 'composing', newTradeButtonLabel: copy.closeComposer, newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose: { ...compose, noFriends: true, friendSelectItems: [{ value: '', label: copy.composer.pickFriend }] } },
}
export const ComposingLoadFailed: Story = {
  args: {
    phase: 'composing',
    newTradeButtonLabel: copy.closeComposer,
    newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' },
    compose: { ...compose, error: copy.errors.composeLoad },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(copy.errors.composeLoad)
  },
}
export const Acting: Story = { args: { phase: 'acting', open: [buildTradeCardModel({ trade: proposedTrade, meSub: 'not-the-sender', memeNames, onRespond: noop, busyTradeId: proposedTrade.id, busyAction: 'accept', now: NOW })] } }
/** the one irreversible action on the surface restates the deal before it fires */
export const ConfirmingAccept: Story = {
  args: {
    phase: 'ready',
    open: [buildTradeCardModel({ trade: proposedTrade, meSub: 'not-the-sender', memeNames, onRespond: noop, now: NOW })],
    confirmDialog: buildConfirmDialogModel({
      id: 'trade-confirm',
      open: true,
      title: copy.confirm.acceptTitle,
      message: [
        { kind: 'strong' as const, text: copy.confirm.give },
        tradeSideSentence(proposedTrade.ask, memeNames),
        copy.confirm.betweenSides,
        { kind: 'strong' as const, text: copy.confirm.get },
        tradeSideSentence(proposedTrade.offer, memeNames),
        copy.confirm.end,
      ],
      confirmLabel: copy.confirm.acceptLabel,
      onConfirm: noop,
      onCancel: noop,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog', { name: copy.confirm.acceptTitle })
    const strongs = dialog.querySelectorAll('strong')
    await expect(strongs[0]).toHaveTextContent(copy.confirm.give.trim())
    await expect(strongs[1]).toHaveTextContent(copy.confirm.get.trim())
    await expect(dialog).toHaveTextContent(tradeSideSentence(proposedTrade.ask, memeNames))
    await expect(dialog).toHaveTextContent(tradeSideSentence(proposedTrade.offer, memeNames))
  },
}

export const ConfirmingWithdraw: Story = {
  args: {
    phase: 'ready',
    open: [openTrade],
    confirmDialog: buildConfirmDialogModel({
      id: 'trade-confirm',
      open: true,
      danger: true,
      title: copy.confirm.withdrawTitle,
      message: copy.confirm.withdraw(
        tradeSideSentence(proposedTrade.offer, memeNames),
        tradeSideSentence(proposedTrade.ask, memeNames),
        proposedTrade.toName,
      ),
      confirmLabel: copy.confirm.withdrawLabel,
      onConfirm: noop,
      onCancel: noop,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog', { name: copy.confirm.withdrawTitle })
    await expect(dialog).toHaveAccessibleDescription(
      copy.confirm.withdraw(
        tradeSideSentence(proposedTrade.offer, memeNames),
        tradeSideSentence(proposedTrade.ask, memeNames),
        proposedTrade.toName,
      ),
    )
  },
}

export const Dark: Story = { ...Ready, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Ready, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Ready,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

/** composer on phone: two columns, one submit, one caption */
export const ComposingPhone390: Story = {
  name: 'Composing phone 390',
  args: ComposingEmptyProposal.args,
  ...phone,
}
