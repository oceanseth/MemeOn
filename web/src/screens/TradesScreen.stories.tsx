import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import type { ChangeEvent } from 'react'
import { friendAccepted, giftablePaper, meLou, paperMeme, proposedTrade, silverMeme } from '../../.storybook/fixtures'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { buildTradeCardModel } from '../molecules/tradeCardModel'
import { TradesScreen } from './TradesScreen'

const noop = fn()
const composerActions = {
  friend: fn(), offerMeme: fn(), offerShares: fn(), offerCoins: fn(), askMeme: fn(), askShares: fn(), askCoins: fn(), propose: fn(),
}
const empty: TradesScreenModel = { phase: 'empty', newTradeButtonLabel: '＋ Propose a trade', newTradeButtonProps: { onClick: noop }, compose: null, open: [], history: [], msg: null, showLoading: false, showLists: true }
const compose = { friendSelectProps: { value: '', onChange: (event: ChangeEvent<HTMLSelectElement>) => composerActions.friend(event.target.value) }, friends: [friendAccepted], offerMemeSelectProps: { value: '', onChange: (event: ChangeEvent<HTMLSelectElement>) => composerActions.offerMeme(event.target.value) }, binderOptions: [{ id: giftablePaper.id, label: `${giftablePaper.title} (you hold ${giftablePaper.myShares})` }], showOfferShares: true, offerSharesInputProps: { value: 5, min: 1, max: 100, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerShares(Number(event.target.value)) }, offerCoinsInputProps: { value: 0, min: 0, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.offerCoins(Number(event.target.value)) }, askMemeSelectProps: { value: '', onChange: (event: ChangeEvent<HTMLSelectElement>) => composerActions.askMeme(event.target.value) }, theirMemeOptions: [{ id: silverMeme.id, label: silverMeme.title }], showAskShares: true, askSharesInputProps: { value: 5, min: 1, max: 100, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askShares(Number(event.target.value)) }, askCoinsInputProps: { value: 0, min: 0, onChange: (event: ChangeEvent<HTMLInputElement>) => composerActions.askCoins(Number(event.target.value)) }, error: null, proposeButtonProps: { onClick: composerActions.propose, disabled: false } }
const meta = { title: 'Screens/TradesScreen', component: TradesScreen, args: empty } satisfies Meta<typeof TradesScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = { args: { phase: 'loading', showLoading: true, showLists: false } }
export const Empty: Story = {}
export const Error: Story = { args: { phase: 'error', msg: 'action failed' } }
export const Ready: Story = { args: { phase: 'ready', open: [buildTradeCardModel({ trade: proposedTrade, meSub: meLou.sub, memeNames: {}, onRespond: noop })], history: [buildTradeCardModel({ trade: { ...proposedTrade, id: 'trade-accepted', status: 'accepted' }, meSub: meLou.sub, memeNames: { [paperMeme.id]: paperMeme.title } })] } }
export const Composing: Story = { args: { phase: 'composing', newTradeButtonLabel: 'Close', compose }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); const selects = canvas.getAllByRole('combobox'); await userEvent.selectOptions(selects[0]!, friendAccepted.sub); await userEvent.selectOptions(selects[1]!, giftablePaper.id); await userEvent.selectOptions(selects[2]!, silverMeme.id); const inputs = canvas.getAllByRole('spinbutton'); for (const [input, value] of [[inputs[0], '7'], [inputs[1], '12'], [inputs[2], '6'], [inputs[3], '8']] as const) await fireEvent.change(input!, { target: { value } }); await userEvent.click(canvas.getByRole('button', { name: 'Propose trade' })); await expect(composerActions.friend).toHaveBeenCalledWith(friendAccepted.sub); await expect(composerActions.offerMeme).toHaveBeenCalledWith(giftablePaper.id); await expect(composerActions.askMeme).toHaveBeenCalledWith(silverMeme.id); await expect(composerActions.offerShares).toHaveBeenLastCalledWith(7); await expect(composerActions.offerCoins).toHaveBeenLastCalledWith(12); await expect(composerActions.askShares).toHaveBeenLastCalledWith(6); await expect(composerActions.askCoins).toHaveBeenLastCalledWith(8); await expect(composerActions.propose).toHaveBeenCalledOnce() } }
export const Acting: Story = { args: { phase: 'acting', open: [buildTradeCardModel({ trade: proposedTrade, meSub: meLou.sub, memeNames: {}, onRespond: noop })] } }
