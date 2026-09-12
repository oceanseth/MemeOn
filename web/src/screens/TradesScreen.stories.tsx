import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, screen, userEvent, within } from 'storybook/test'
import { MemoryRouter } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import { friendAccepted, giftablePaper, meLou, paperMeme, proposedTrade, silverMeme } from '../../.storybook/fixtures'
import type { TradeComposerModel, TradesScreenModel } from '../hooks/useTradesScreen'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildTradeCardModel, type TradeMemeInfoMap } from '../lib/tradeCardModel'
import { TradesScreen } from './TradesScreen'

const noop = fn()
/** The Base UI trigger opens a portalled listbox, so the option is picked from `screen`. */
async function pickOption(trigger: HTMLElement, optionName: string): Promise<void> {
  await userEvent.click(trigger)
  const listbox = await screen.findByRole('listbox')
  await userEvent.click(within(listbox).getByRole('option', { name: optionName }))
}
const composerActions = {
  friend: fn(), offerMeme: fn(), offerShares: fn(), offerCoins: fn(), askMeme: fn(), askShares: fn(), askCoins: fn(), propose: fn(), submit: fn(),
}
// story-local: a fixed clock so the relative timestamps render the same on every run
const NOW = new Date(proposedTrade.createdAt).getTime() + 3 * 60 * 60 * 1000
const memeNames: TradeMemeInfoMap = {
  [paperMeme.id]: { title: paperMeme.title, imageUrl: paperMeme.imageUrl, tierKey: 'paper', tierName: 'Paper', tierLabel: 'Paper · common', reshares: 0 },
  [silverMeme.id]: { title: silverMeme.title, imageUrl: silverMeme.imageUrl, tierKey: 'silver', tierName: 'Silver', tierLabel: 'Silver · uncommon', reshares: 12 },
}
const closedDialog = buildConfirmDialogModel({ open: false, title: '', message: '', onConfirm: noop, onCancel: noop })
const empty: TradesScreenModel = {
  phase: 'empty', newTradeButtonLabel: 'Propose a trade', newTradeButtonProps: { onClick: noop, 'aria-expanded': false, 'aria-controls': 'trade-composer' },
  compose: null, open: [], openCountLabel: null, history: [],
  msg: null, noticeProps: { role: 'status', 'aria-live': 'polite' },
  err: null, errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' }, showErrorNotice: false,
  showError: false, retryButtonProps: { onClick: noop },
  showLoading: false, loadingProps: { role: 'status', 'aria-live': 'polite' }, loadingLabel: 'Loading trades…',
  showLists: true, confirmDialog: closedDialog,
}
const compose: TradeComposerModel = {
  formProps: { id: 'trade-composer', onSubmit: (event) => { event.preventDefault(); composerActions.submit() } },
  noFriends: false,
  friendSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.friend(value) }, friends: [friendAccepted],
  offerMemeSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.offerMeme(value) },
  binderOptions: [{ id: giftablePaper.id, label: `${giftablePaper.title} (you hold ${giftablePaper.myShares})` }], showOfferShares: true,
  offerSharesInputProps: { value: 5, min: 1, max: 12, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerShares(Number(event.target.value)) }, offerSharesHint: 'you hold 12',
  offerCoinsInputProps: { value: 0, min: 0, max: meLou.coins, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerCoins(Number(event.target.value)) }, offerCoinsHint: `🧠 ${meLou.coins} available`,
  askMemeSelectProps: { value: '', onValueChange: (value: string | null) => composerActions.askMeme(value) }, theirMemeOptions: [{ id: silverMeme.id, label: silverMeme.title }], showAskShares: true,
  askSharesInputProps: { value: 5, min: 1, max: 100, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askShares(Number(event.target.value)) },
  askCoinsInputProps: { value: 0, min: 0, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askCoins(Number(event.target.value)) },
  error: null, errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' }, proposeButtonProps: { onClick: composerActions.propose, disabled: false },
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
export const ActionError: Story = { args: { phase: 'error', err: "Couldn't send your answer — this trade may already have been answered. Try again.", showErrorNotice: true, open: [openTrade] } }
/** the list itself never arrived: a retry, not a fake empty state */
export const LoadError: Story = { args: { phase: 'error', err: "Couldn't load your trades. Try again.", showError: true, showLists: false } }
export const Ready: Story = {
  args: { phase: 'ready', open: [openTrade], openCountLabel: '1 waiting', history: [pastTrade] },
  play: async ({ canvasElement }) => {
    // the region is mounted and silent before there is anything to announce
    await expect(within(canvasElement).getByRole('status')).toBeEmptyDOMElement()
  },
}
/** the outcome of the app's most irreversible action, announced by a region that was already there */
export const Proposed: Story = {
  args: { phase: 'ready', msg: 'Trade proposed. It is on their table now.', open: [openTrade], openCountLabel: '1 waiting', history: [pastTrade] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Trade proposed.')
  },
}
export const Composing: Story = {
  args: { phase: 'composing', newTradeButtonLabel: 'Close', newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose },
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); const selects = canvas.getAllByRole('combobox'); await pickOption(selects[0]!, friendAccepted.name); await pickOption(selects[1]!, `${giftablePaper.title} (you hold ${giftablePaper.myShares})`); await pickOption(selects[2]!, silverMeme.title); const inputs = canvas.getAllByRole('spinbutton'); for (const [input, value] of [[inputs[0], '7'], [inputs[1], '12'], [inputs[2], '6'], [inputs[3], '8']] as const) await fireEvent.change(input!, { target: { value } }); await userEvent.click(canvas.getByRole('button', { name: 'Propose trade' })); await expect(composerActions.friend).toHaveBeenCalledWith(friendAccepted.sub); await expect(composerActions.offerMeme).toHaveBeenCalledWith(giftablePaper.id); await expect(composerActions.askMeme).toHaveBeenCalledWith(silverMeme.id); await expect(composerActions.offerShares).toHaveBeenLastCalledWith(7); await expect(composerActions.offerCoins).toHaveBeenLastCalledWith(12); await expect(composerActions.askShares).toHaveBeenLastCalledWith(6); await expect(composerActions.askCoins).toHaveBeenLastCalledWith(8); await expect(composerActions.submit).toHaveBeenCalledOnce() },
}
/** nothing on either side: the button cannot post a nothing-for-nothing proposal */
export const ComposingEmptyProposal: Story = {
  args: { phase: 'composing', newTradeButtonLabel: 'Close', newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose: { ...compose, showOfferShares: false, showAskShares: false, proposeButtonProps: { onClick: composerActions.propose, disabled: true } } },
}
/** no accepted friends: the form has nothing to work with, so it says so */
export const ComposingNoFriends: Story = {
  args: { phase: 'composing', newTradeButtonLabel: 'Close', newTradeButtonProps: { onClick: noop, 'aria-expanded': true, 'aria-controls': 'trade-composer' }, compose: { ...compose, noFriends: true, friends: [] } },
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
      title: 'Accept this trade?',
      message: <><strong>You give </strong>2 shares of "group-chat silver" + 🧠 10. <strong>You get </strong>5 shares of "fresh paper".</>,
      confirmLabel: 'Accept',
      onConfirm: noop,
      onCancel: noop,
    }),
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
