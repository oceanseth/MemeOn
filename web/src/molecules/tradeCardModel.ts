import type { ButtonHTMLAttributes } from 'react'
import type { Trade, TradeSide } from '../lib/types'

export type TradeAction = 'accept' | 'decline' | 'cancel'

export interface TradeSideSummaryModel {
  ownerLabel: string
  empty: boolean
  memeLines: readonly { id: string; sharesLabel: string; title: string }[]
  coinsLabel: string | null
}

export interface TradeActionModel {
  label: string
  className: 'primary' | 'danger'
  buttonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
}

export interface TradeCardModel {
  id: string
  partiesLabel: string
  statusLabel: string
  createdLabel: string
  offer: TradeSideSummaryModel
  ask: TradeSideSummaryModel
  actions: readonly TradeActionModel[]
}

const STATUS_BADGE: Record<Trade['status'], string> = {
  proposed: '⏳ proposed',
  accepted: '✅ accepted',
  declined: '❌ declined',
  cancelled: '🚫 cancelled',
}

function buildSideSummary(side: TradeSide, owner: string, memeNames: Record<string, string>): TradeSideSummaryModel {
  return {
    ownerLabel: `${owner} gives`,
    empty: side.memes.length === 0 && side.coins === 0,
    memeLines: side.memes.map((meme) => ({
      id: meme.memeId,
      sharesLabel: `${meme.shares} shares of`,
      title: memeNames[meme.memeId] ?? meme.memeId,
    })),
    coinsLabel: side.coins > 0 ? `🧠 ${side.coins.toLocaleString()}` : null,
  }
}

export function buildTradeCardModel({
  trade,
  meSub,
  memeNames,
  onRespond,
}: {
  trade: Trade
  meSub: string
  memeNames: Record<string, string>
  onRespond?: ((trade: Trade, action: TradeAction) => void) | undefined
}): TradeCardModel {
  const mine = trade.fromId === meSub
  const actions: TradeActionModel[] =
    trade.status !== 'proposed' || !onRespond
      ? []
      : mine
        ? [{ label: 'Cancel', className: 'danger', buttonProps: { onClick: () => onRespond(trade, 'cancel') } }]
        : [
            { label: 'Accept', className: 'primary', buttonProps: { onClick: () => onRespond(trade, 'accept') } },
            { label: 'Decline', className: 'danger', buttonProps: { onClick: () => onRespond(trade, 'decline') } },
          ]

  return {
    id: trade.id,
    partiesLabel: `${trade.fromName} ⇄ ${trade.toName}`,
    statusLabel: STATUS_BADGE[trade.status],
    createdLabel: new Date(trade.createdAt).toLocaleString(),
    offer: buildSideSummary(trade.offer, trade.fromName, memeNames),
    ask: buildSideSummary(trade.ask, trade.toName, memeNames),
    actions,
  }
}
