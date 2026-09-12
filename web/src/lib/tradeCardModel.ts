import type { ButtonHTMLAttributes } from 'react'
import { braincells } from './braincells'
import type { Trade, TradeSide } from './types'

export type TradeAction = 'accept' | 'decline' | 'cancel'

/** What a trade list knows about a meme once its record has landed. */
export interface TradeMemeInfo {
  title: string
  imageUrl: string
  tierKey: string
  /** the tier's product name on its own — what a `TierChip` prints */
  tierName: string
  tierLabel: string
  reshares: number
}

export type TradeMemeInfoMap = Readonly<Record<string, TradeMemeInfo>>

export interface TradeMemeLineModel {
  id: string
  sharesLabel: string
  /** a neutral placeholder until the record lands — a raw id never reaches the DOM as prose */
  title: string
  thumbUrl: string | null
  tierKey: string | null
  /** the chip's label; null until the meme's record lands */
  tierName: string | null
  tierLabel: string | null
  resharesLabel: string | null
  detailHref: string
}

export interface TradeSideSummaryModel {
  /** whose side this is, read from where you are standing: "You give" / "You get" */
  ownerLabel: string
  empty: boolean
  memeLines: readonly TradeMemeLineModel[]
  coinsLabel: string | null
}

export interface TradeActionModel {
  kind: TradeAction
  label: string
  /**
   * Which button the row wears: the constructive answer is the card's one bubblegum, declining is
   * the neutral raised pill beside it, and withdrawing your own live offer is destructive.
   */
  variant: 'primary' | 'default' | 'danger'
  buttonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'disabled' | 'aria-busy' | 'aria-label'
  >
}

export interface TradeCardModel {
  id: string
  /** the deal in one line, from where you are standing: "CyberSeth offered you a deal" */
  partiesLabel: string
  statusLabel: string
  /** the badge only earns its place once the subline stops saying who is waiting */
  showStatusBadge: boolean
  /** "Waiting on you" / "Waiting on them" / the resolved word — the subline's first half */
  waitingLabel: string
  /** relative age — the scannable value */
  createdLabel: string
  /** machine-readable original, for <time dateTime> */
  createdAtIso: string
  /** exact local timestamp, kept on hover and for assistive tech */
  createdTitle: string
  /** the board's LEFT well (`JXY-0`): what leaves your binder — always "You give" */
  give: TradeSideSummaryModel
  /** the board's RIGHT well (`JY6-0`): what lands in it — always "You get" */
  get: TradeSideSummaryModel
  /** what leaves your binder the moment you accept; null when there is nothing to answer */
  finalityLine: string | null
  actions: readonly TradeActionModel[]
}

const STATUS_BADGE: Record<Trade['status'], string> = {
  proposed: '⏳ proposed',
  accepted: '✅ accepted',
  declined: '❌ declined',
  cancelled: '🚫 cancelled',
}

/** The subline's first half once a trade is settled. */
const STATUS_LINE: Record<Trade['status'], string> = {
  proposed: 'Waiting',
  accepted: 'Deal complete',
  declined: 'Declined',
  cancelled: 'Withdrawn',
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** stands in for a title still in flight, until the meme's record lands */
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
  if (side.coins > 0) parts.push(braincells(side.coins))
  return parts.length === 0 ? 'nothing' : parts.join(' + ')
}

/**
 * The finality note the Trade board prints under the wells (`LPR-0`). It names what leaves *your*
 * binder, so it is only written for a live proposal you can still answer.
 */
function finalityLine(yours: TradeSide, memeNames: TradeMemeInfoMap): string | null {
  const parts = yours.memes.map((meme) => {
    const info = memeNames[meme.memeId]
    const tier = info?.tierName ? `${info.tierName} ` : ''
    return `${meme.shares} ${tier}share${meme.shares === 1 ? '' : 's'}`
  })
  if (yours.coins > 0) parts.push(braincells(yours.coins))
  if (parts.length === 0) {
    return 'Trades are final — nothing leaves your binder, but the cards you get are yours the moment you accept.'
  }
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return `Trades are final — ${list} leave your binder the moment you accept.`
}

function buildSideSummary(
  side: TradeSide,
  owner: string,
  memeNames: TradeMemeInfoMap,
): TradeSideSummaryModel {
  return {
    ownerLabel: owner,
    empty: side.memes.length === 0 && side.coins === 0,
    memeLines: side.memes.map((meme) => {
      const info = memeNames[meme.memeId] ?? null
      return {
        id: meme.memeId,
        sharesLabel: sharesPhrase(meme.shares),
        title: info?.title ?? PENDING_TITLE,
        thumbUrl: info?.imageUrl ?? null,
        tierKey: info?.tierKey ?? null,
        tierName: info?.tierName ?? null,
        tierLabel: info?.tierLabel ?? null,
        resharesLabel: info ? info.reshares.toLocaleString() : null,
        detailHref: `/m/${meme.memeId}`,
      }
    }),
    coinsLabel: side.coins > 0 ? braincells(side.coins) : null,
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
  const open = trade.status === 'proposed'
  const actions: TradeActionModel[] =
    !open || !onRespond
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
        : /* the board's own action row (`JYC-0`) reads Decline → Accept, left to right: the quiet
             answer sits first and the card's one bubblegum closes the row under the "You get" well */
          [
            {
              /* the quiet answer is neutral raised, not a second loud colour: only Accept is loud */
              kind: 'decline',
              label: running('decline') ? 'Declining…' : 'Decline',
              variant: 'default',
              buttonProps: {
                onClick: () => onRespond(trade, 'decline'),
                disabled: locked,
                'aria-busy': running('decline'),
                'aria-label': `Decline ${trade.fromName}'s trade`,
              },
            },
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
          ]

  /* `trade.offer` is always what the proposer puts up; which side of the table you are on decides
     whether that reads as giving or getting. The card's wells are keyed to the *reading*, never to
     the record: the board (`JXT-0`, an incoming deal) draws "You give" left and "You get" right,
     so the left well is always yours to lose and the right always yours to gain. */
  const yours = mine ? trade.offer : trade.ask
  const theirs = mine ? trade.ask : trade.offer
  return {
    id: trade.id,
    partiesLabel: open
      ? mine
        ? `You offered ${trade.toName} a deal`
        : `${trade.fromName} offered you a deal`
      : `Your deal with ${mine ? trade.toName : trade.fromName}`,
    statusLabel: STATUS_BADGE[trade.status],
    showStatusBadge: !open,
    waitingLabel: open ? (mine ? 'Waiting on them' : 'Waiting on you') : STATUS_LINE[trade.status],
    createdLabel: relativeAge(trade.createdAt, now),
    createdAtIso: trade.createdAt,
    createdTitle: new Date(trade.createdAt).toLocaleString(),
    give: buildSideSummary(yours, 'You give', memeNames),
    get: buildSideSummary(theirs, 'You get', memeNames),
    finalityLine: actions.length > 0 && !mine ? finalityLine(yours, memeNames) : null,
    actions,
  }
}
