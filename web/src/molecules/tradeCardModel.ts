import type { ButtonHTMLAttributes } from 'react'
import type { Trade, TradeSide } from '../lib/types'

export type TradeAction = 'accept' | 'decline' | 'cancel'

/** What a trade list knows about a meme once its record has landed. */
export interface TradeMemeInfo {
  title: string
  imageUrl: string
  tierKey: string
  tierLabel: string
  tierColor: string
  reshares: number
}

export type TradeMemeInfoMap = Readonly<Record<string, TradeMemeInfo>>

export interface TradeMemeLineModel {
  id: string
  sharesLabel: string
  /** a neutral placeholder until the record lands — a raw id never reaches the DOM as prose */
  title: string
  pending: boolean
  /** the raw id, for debugging only; never rendered as copy */
  titleAttr: string
  thumbUrl: string | null
  tierKey: string | null
  tierLabel: string | null
  tierColor: string | null
  resharesLabel: string | null
  detailHref: string
}

export interface TradeSideSummaryModel {
  ownerLabel: string
  empty: boolean
  memeLines: readonly TradeMemeLineModel[]
  coinsLabel: string | null
}

export interface TradeActionModel {
  kind: TradeAction
  label: string
  /** which button the row wears: the constructive answer is the loudest control */
  variant: 'primary' | 'danger'
  buttonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'disabled' | 'aria-busy' | 'aria-label'
  >
}

export interface TradeCardModel {
  id: string
  partiesLabel: string
  statusLabel: string
  /** relative age — the scannable value */
  createdLabel: string
  /** machine-readable original, for <time dateTime> */
  createdAtIso: string
  /** exact local timestamp, kept on hover and for assistive tech */
  createdTitle: string
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

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** stands in for a title still in flight; the row swaps it for a shimmer once SideSummary reads `pending` */
const PENDING_TITLE = '…'

const sharesPhrase = (shares: number): string => `${shares} share${shares === 1 ? '' : 's'} of`

/** Relative age is what you scan when triaging proposals; the exact value rides on <time>. */
function relativeAge(createdAt: string, now: number): string {
  const then = new Date(createdAt).getTime()
  if (!Number.isFinite(then)) return ''
  const elapsed = now - then
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 2 * DAY) return 'yesterday'
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** One side of a deal as a sentence, for the confirmation dialog. */
export function tradeSideSentence(side: TradeSide, memeNames: TradeMemeInfoMap): string {
  const parts = side.memes.map(
    (meme) => `${sharesPhrase(meme.shares)} "${memeNames[meme.memeId]?.title ?? 'that meme'}"`,
  )
  if (side.coins > 0) parts.push(`🧠 ${side.coins.toLocaleString()}`)
  return parts.length === 0 ? 'nothing' : parts.join(' + ')
}

function buildSideSummary(
  side: TradeSide,
  owner: string,
  memeNames: TradeMemeInfoMap,
): TradeSideSummaryModel {
  return {
    ownerLabel: `${owner} gives`,
    empty: side.memes.length === 0 && side.coins === 0,
    memeLines: side.memes.map((meme) => {
      const info = memeNames[meme.memeId] ?? null
      return {
        id: meme.memeId,
        sharesLabel: sharesPhrase(meme.shares),
        title: info?.title ?? PENDING_TITLE,
        pending: info === null,
        titleAttr: meme.memeId,
        thumbUrl: info?.imageUrl ?? null,
        tierKey: info?.tierKey ?? null,
        tierLabel: info?.tierLabel ?? null,
        tierColor: info?.tierColor ?? null,
        resharesLabel: info ? info.reshares.toLocaleString() : null,
        detailHref: `/m/${meme.memeId}`,
      }
    }),
    coinsLabel: side.coins > 0 ? `🧠 ${side.coins.toLocaleString()}` : null,
  }
}

export function buildTradeCardModel({
  trade,
  meSub,
  memeNames,
  onRespond,
  busyTradeId = null,
  busyAction = null,
  now = Date.now(),
}: {
  trade: Trade
  meSub: string
  memeNames: TradeMemeInfoMap
  onRespond?: ((trade: Trade, action: TradeAction) => void) | undefined
  /** the trade currently in flight; every action locks while one is */
  busyTradeId?: string | null
  /** which of that trade's actions is in flight, so only it reads as running */
  busyAction?: TradeAction | null
  /** injectable clock so stories and tests are deterministic */
  now?: number
}): TradeCardModel {
  const mine = trade.fromId === meSub
  const locked = busyTradeId !== null
  const running = (kind: TradeAction): boolean => busyTradeId === trade.id && busyAction === kind
  const actions: TradeActionModel[] =
    trade.status !== 'proposed' || !onRespond
      ? []
      : mine
        ? [
            {
              kind: 'cancel',
              label: running('cancel') ? 'Withdrawing…' : 'Withdraw',
              variant: 'danger',
              buttonProps: {
                onClick: () => onRespond(trade, 'cancel'),
                disabled: locked,
                'aria-busy': running('cancel'),
                'aria-label': `Withdraw your proposal to ${trade.toName}`,
              },
            },
          ]
        : [
            {
              kind: 'accept',
              label: running('accept') ? 'Accepting…' : 'Accept',
              variant: 'primary',
              buttonProps: {
                onClick: () => onRespond(trade, 'accept'),
                disabled: locked,
                'aria-busy': running('accept'),
                'aria-label': `Accept ${trade.fromName}'s trade`,
              },
            },
            {
              kind: 'decline',
              label: running('decline') ? 'Declining…' : 'Decline',
              variant: 'danger',
              buttonProps: {
                onClick: () => onRespond(trade, 'decline'),
                disabled: locked,
                'aria-busy': running('decline'),
                'aria-label': `Decline ${trade.fromName}'s trade`,
              },
            },
          ]

  return {
    id: trade.id,
    partiesLabel: `${trade.fromName} ⇄ ${trade.toName}`,
    statusLabel: STATUS_BADGE[trade.status],
    createdLabel: relativeAge(trade.createdAt, now),
    createdAtIso: trade.createdAt,
    createdTitle: new Date(trade.createdAt).toLocaleString(),
    offer: buildSideSummary(trade.offer, trade.fromName, memeNames),
    ask: buildSideSummary(trade.ask, trade.toName, memeNames),
    actions,
  }
}
