import type { ChangeEventHandler, HTMLAttributes } from 'react'
import { TIERS } from '@memeon/shared/tiers'
import type { IconName } from '@/atoms/icon'
import { memeDetailCopy } from '../copy/memeDetail'
import { buildConfirmDialogModel, type ConfirmDialogModel } from './confirmDialogModel'
import { buildMemeCardModel, type MemeCardModel } from './memeCardModel'
import { memeReshareCount, memeViewCount } from './memeMetrics'
import { buildMemeplexPanelModel, type MemeplexPanelModel } from './memeplexPanelModel'
import type { Me, Meme } from './types'
import type { MemeDetailContext, MemeDetailPhase } from '../stores/memeDetailMachine'

const ARCHIVE_SUB = 'meme_archive'
/** braincell spend that earns a restatement before it leaves the wallet */
const CONFIRM_SPEND_OVER = 25
const copy = memeDetailCopy

export interface CapRow {
  userId: string
  sharesLabel: string
  label: string
}
export interface DetailActionModel {
  label: string
  icon: IconName
  variant?: 'destructive' | undefined
  buttonProps: { onClick: () => void }
}
export type DetailLiveRegionProps = Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-live'>
export interface DetailNotFoundModel {
  title: string
  message: string
  linkProps: { to: string }
  linkLabel: string
}
export interface DetailSignedOutModel {
  title: string
  body: string
  loginLabel: string
  loginButtonProps: {
    onClick: () => void
    disabled: boolean
    'aria-busy': boolean
    'aria-label': string
  }
  browseLinkProps: { to: string }
  browseLabel: string
  error: string | null
  errorProps: Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>
}
export interface DetailTierLadderModel {
  /** the meter's left label — the tier this card is wearing right now */
  currentLabel: string
  nextLabel: string
  /** the meter fill as a percentage; `Progress` owns the role and the `aria-value*` wiring */
  value: number
  meterProps: {
    'aria-label': string
    'aria-valuetext': string
  }
}
export interface DetailListingModel {
  saleLabel: string
  sharesLabel: string
  priceLabel: string
  showBuy: boolean
  showUnlist: boolean
  buyLabel: string
  /** the card's caption: what the viewer can spend, and the invitation to pick an amount */
  balanceLabel: string | null
  disabledReason: string | null
  buyInputProps: {
    value: number
    min: number
    max: number
    step: 1
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  buyButtonLabel: string
  buyButtonProps: {
    onClick: () => void
    disabled: boolean
    'aria-busy': boolean
  }
  unlistButtonLabel: string
  unlistButtonProps: {
    onClick: () => void
    disabled: boolean
    'aria-busy': boolean
  }
}
export interface DetailListModel {
  show: boolean
  panelTitle: string
  panelCaption: string
  sharesFieldLabel: string
  perShareLabel: string
  priceSrLabel: string
  disabledReason: string | null
  sharesInputProps: {
    value: number
    min: number
    max: number
    step: 1
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  priceInputProps: {
    value: number
    min: number
    step: number
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  listButtonLabel: string
  listButtonProps: {
    onClick: () => void
    disabled: boolean
    'aria-busy': boolean
  }
}
export interface DetailSourceModel {
  id: string
  label: string
  viewsLabel: string
  linkProps?: { href: string; target: '_blank'; rel: 'noreferrer' } | undefined
}
export interface MemeDetailModel {
  id: string
  title: string
  private: boolean
  tierKey: string
  /** Tier product name (Paper … Shiny). */
  tierName: string
  /** Hero callout under the title: "Prismatic · 5,800 reshares". */
  tierLine: string
  tierLabel: string
  tierHype: string
  tierLadder: DetailTierLadderModel
  /** the hero frame: the same `MemeCardModel` every grid thumb renders, at `size="lg"` */
  card: MemeCardModel
  creatorLinkProps: { to: string }
  creatorName: string
  ownerLinkProps: { to: string }
  ownerName: string
  tagsLabel: string | null
  remixLinkProps?: { to: string } | undefined
  sourceLinkProps?: { href: string; target: '_blank'; rel: 'noreferrer' } | undefined
  sourceLabel?: string | undefined
  viewsLabel: string
  resharesLabel: string
  /** the nouns agree with the figures beside them: real cards do have exactly 1 reshare */
  viewsWord: string
  resharesWord: string
  valueLabel: string
  /** spoken names for the compact stat row, whose glyphs are decorative */
  statsSrLabel: string
  valueSrLabel: string
  holdingsLabel: string | null
  shareTitle: string
  shareCaption: string
  previewLabel: string
  shareInputProps: { value: string; readOnly: true; 'aria-label': string }
  copyDone: boolean
  copyButtonLabel: string
  copyButtonProps: { onClick: () => void }
  previewLinkProps: { href: string; target: '_blank'; rel: 'noreferrer' }
  signedOut: DetailSignedOutModel | null
  actions: readonly DetailActionModel[]
  controlsTitle: string
  controlsCaption: string
  spreadingTitle: string
  provenanceMintedBy: string
  provenanceOwnedBy: string
  provenanceRemix: string
  provenanceYouHold: string
  provenanceSeparator: string
  privateBadgeLabel: string
  notice: string | null
  noticeProps: DetailLiveRegionProps
  error: string | null
  errorProps: DetailLiveRegionProps
  listing: DetailListingModel | null
  list: DetailListModel
  sources: readonly DetailSourceModel[]
  plex: MemeplexPanelModel
  capTableTitle: string
  /** Cap-table note: who is selling and how much. */
  capTableNote: string | null
  capTable: readonly CapRow[]
  deleteDialog: ConfirmDialogModel
  buyDialog: ConfirmDialogModel
  claimDialog: ConfirmDialogModel
}
export interface MemeDetailScreenModel {
  phase: MemeDetailPhase
  showNotFound: boolean
  showLoading: boolean
  notFound: DetailNotFoundModel
  loadingLabel: string
  detail: MemeDetailModel | null
}

/** IO and send wrappers the ready-path bag wires into props. */
export interface MemeDetailModelActions {
  onBuySharesChange: ChangeEventHandler<HTMLInputElement>
  onSellSharesChange: ChangeEventHandler<HTMLInputElement>
  onPriceChange: ChangeEventHandler<HTMLInputElement>
  onCopy: () => void
  onPlexAdd: (memeId: string) => void
  onPlexPickChange: (pick: string) => void
  onPlexPastedChange: (pasted: string) => void
  onRemix: () => void
  onLogin: () => void
  onStartClaim: () => void
  onStartDelete: () => void
  onToggleVisibility: () => void
  onUnlist: () => void
  onList: () => void
  requestBuyConfirm: () => void
  runBuy: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
  onBuyCancel: () => void
  onClaimCancel: () => void
  onClaimConfirm: () => void
  onClaimNoteChange: (note: string) => void
}

export interface BuildMemeDetailModelInput {
  phase: MemeDetailPhase
  context: MemeDetailContext
  meme: Meme
  user: Me | null
  shareUrl: string
  holderNameCache: Map<string, string>
  actions: MemeDetailModelActions
}

function holderLabel(
  userId: string,
  meSub: string | null,
  names: Record<string, string>,
  cache: Map<string, string>,
): string {
  if (meSub && userId === meSub) return copy.holder.you
  return names[userId] ?? cache.get(userId) ?? copy.holder.unknown
}

/** Where this card sits on the rarity ladder, and what the next rung costs. */
export function buildTierLadderModel(tierKey: string, views: number): DetailTierLadderModel {
  const paper = TIERS[0]
  if (!paper) throw new Error('TIERS is empty')
  const tier = TIERS.find((candidate) => candidate.key === tierKey) ?? paper
  const next = TIERS.find((candidate) => candidate.minReshares > tier.minReshares)
  if (!next) {
    return {
      currentLabel: copy.ladder.current(tier.name),
      nextLabel: copy.ladder.top(tier.name),
      value: 100,
      meterProps: {
        'aria-label': copy.ladder.meterLabel,
        'aria-valuetext': copy.ladder.topValueText(tier.name),
      },
    }
  }
  const span = Math.max(1, next.minReshares - tier.minReshares)
  const progress = Math.min(100, Math.max(0, Math.round(((views - tier.minReshares) / span) * 100)))
  const remaining = Math.max(0, next.minReshares - views)
  const nextLabel = copy.ladder.next(remaining, next.name)
  return {
    currentLabel: copy.ladder.current(tier.name),
    nextLabel,
    value: progress,
    meterProps: {
      'aria-label': copy.ladder.meterLabel,
      'aria-valuetext': nextLabel,
    },
  }
}

function eagerHeroCard(meme: Meme): MemeCardModel {
  const built = buildMemeCardModel(meme)
  return built.media.kind === 'image'
    ? {
        ...built,
        media: {
          ...built.media,
          imageProps: { ...built.media.imageProps, loading: 'eager' },
        },
      }
    : built
}

/** Ready-path field bags: listing, list, actions, signed-out, hero, share, sources, cap, plex, confirms. */
export function buildMemeDetailModel({
  phase,
  context,
  meme,
  user,
  shareUrl,
  holderNameCache,
  actions,
}: BuildMemeDetailModelInput): MemeDetailModel {
  const myShares = context.positions.find((position) => position.userId === user?.sub)?.shares ?? 0
  const isSeller = meme.listing?.sellerId === user?.sub
  const held = user?.coins ?? 0
  const views = memeViewCount(meme)
  const reshareCount = memeReshareCount(meme)
  const pricePerShare = meme.listing?.pricePerShare ?? 0
  const buyShares = context.buyShares
  const buyTotal = Math.ceil(buyShares * pricePerShare)
  const shortBy = Math.max(0, buyTotal - held)
  const buyReason =
    buyShares < 1 ? copy.listing.pickAtLeastOne : shortBy > 0 ? copy.listing.short(shortBy) : null
  const sellShares = context.sellShares
  const listReason =
    sellShares < 1
      ? copy.listing.pickAtLeastOne
      : sellShares > myShares
        ? copy.list.onlyHold(myShares)
        : context.price < 0.01
          ? copy.list.minPrice
          : null

  const listing: DetailListingModel | null =
    meme.listing && meme.listing.shares > 0
      ? {
          saleLabel: copy.listing.sale(meme.listing.shares, meme.listing.pricePerShare),
          sharesLabel: copy.listing.shares(meme.listing.shares),
          priceLabel: copy.listing.price(meme.listing.pricePerShare),
          showBuy: !!user && !isSeller,
          showUnlist: !!isSeller,
          buyLabel: copy.listing.buyInputLabel,
          balanceLabel: user ? copy.listing.balance(held) : null,
          disabledReason: buyReason,
          buyInputProps: {
            value: buyShares,
            min: 1,
            max: meme.listing.shares,
            step: 1,
            onChange: actions.onBuySharesChange,
          },
          buyButtonLabel:
            phase === 'buying'
              ? copy.listing.buying
              : buyShares < 1
                ? copy.listing.buy
                : copy.listing.buyFor(buyTotal),
          buyButtonProps: {
            onClick: () => {
              if (buyTotal > CONFIRM_SPEND_OVER) actions.requestBuyConfirm()
              else actions.runBuy()
            },
            disabled: phase === 'buying' || !!buyReason,
            'aria-busy': phase === 'buying',
          },
          unlistButtonLabel: phase === 'listing' ? copy.listing.unlisting : copy.listing.unlist,
          unlistButtonProps: {
            onClick: actions.onUnlist,
            disabled: phase === 'listing',
            'aria-busy': phase === 'listing',
          },
        }
      : null

  const detailActions: DetailActionModel[] = []
  if (user)
    detailActions.push({
      label: copy.actions.remix,
      icon: 'dna',
      buttonProps: { onClick: actions.onRemix },
    })
  if (user && meme.creatorId === ARCHIVE_SUB)
    detailActions.push({
      label: copy.actions.claim,
      icon: 'film',
      buttonProps: { onClick: actions.onStartClaim },
    })
  if (myShares === 100)
    detailActions.push({
      label: meme.private ? copy.actions.makePublic : copy.actions.makePrivate,
      icon: meme.private ? 'globe' : 'eye-off',
      buttonProps: { onClick: actions.onToggleVisibility },
    })
  if (myShares === 100 && meme.private)
    detailActions.push({
      label: copy.actions.delete,
      icon: 'trash-2',
      variant: 'destructive',
      buttonProps: { onClick: actions.onStartDelete },
    })

  /* Seller is a holder — resolve the name like cap-table rows. */
  const capTableNote: string | null =
    meme.listing && meme.listing.shares > 0
      ? copy.capTable.note(
          meme.listing.shares,
          isSeller
            ? null
            : holderLabel(
                meme.listing.sellerId,
                user?.sub ?? null,
                context.holderNames,
                holderNameCache,
              ),
        )
      : null

  const signedOut: DetailSignedOutModel | null = user
    ? null
    : {
        title: copy.signedOut.title,
        /* Listing price lives on the hero card footer — don't repeat it in this panel. */
        body: copy.signedOut.body,
        loginLabel: context.loggingIn ? copy.signedOut.redirecting : copy.signedOut.login,
        loginButtonProps: {
          onClick: actions.onLogin,
          disabled: context.loggingIn,
          'aria-busy': context.loggingIn,
          'aria-label': context.loggingIn
            ? copy.signedOut.redirectingLabel
            : copy.signedOut.loginLabel,
        },
        browseLinkProps: { to: '/marketplace' },
        browseLabel: copy.signedOut.browse,
        error: context.loginErr,
        errorProps: { role: 'alert' },
      }

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
    /* the same stable factory every grid thumb builds its card from; the one deviation is `loading`,
       since the hero is always above the fold and the factory's `lazy` default is a grid thumb's
       assumption, not this page's. */
    card: eagerHeroCard(meme),
    creatorLinkProps: { to: `/u/${encodeURIComponent(meme.creatorId)}` },
    creatorName: meme.creatorName,
    ownerLinkProps: { to: `/u/${encodeURIComponent(meme.ownerId)}` },
    ownerName: meme.ownerName,
    tagsLabel: meme.tags.length ? meme.tags.map((tag) => `#${tag}`).join(' ') : null,
    remixLinkProps: meme.remixOf ? { to: `/m/${meme.remixOf}` } : undefined,
    sourceLinkProps: meme.source
      ? { href: meme.source.url, target: '_blank', rel: 'noreferrer' }
      : undefined,
    sourceLabel: meme.source
      ? copy.hero.source(meme.source.provider, meme.source.author)
      : undefined,
    viewsLabel: views.toLocaleString(),
    resharesLabel: reshareCount.toLocaleString(),
    valueLabel: meme.value.toLocaleString(),
    viewsWord: copy.stats.viewsWord(views),
    resharesWord: copy.stats.resharesWord(reshareCount),
    statsSrLabel: copy.stats.srLabel(views, reshareCount),
    valueSrLabel: copy.stats.valueSrLabel(meme.value),
    holdingsLabel: myShares > 0 ? `${myShares}/100` : null,
    shareTitle: copy.share.title,
    shareCaption: copy.share.caption,
    previewLabel: copy.share.preview,
    shareInputProps: {
      value: shareUrl,
      readOnly: true,
      'aria-label': copy.share.inputLabel,
    },
    copyDone: context.copied,
    copyButtonLabel: context.copied
      ? copy.share.copied
      : context.copyFailed
        ? copy.share.copyFailed
        : copy.share.copy,
    copyButtonProps: { onClick: actions.onCopy },
    previewLinkProps: {
      href: `/api/memes/${meme.id}/og.png`,
      target: '_blank',
      rel: 'noreferrer',
    },
    signedOut,
    actions: detailActions,
    controlsTitle: copy.controls.title,
    controlsCaption: copy.controls.caption,
    spreadingTitle: copy.spreading.title,
    provenanceMintedBy: copy.provenance.mintedBy,
    provenanceOwnedBy: copy.provenance.ownedBy,
    provenanceRemix: copy.provenance.remix,
    provenanceYouHold: copy.provenance.youHold,
    provenanceSeparator: copy.provenance.separator,
    privateBadgeLabel: copy.privateBadge,
    notice: context.msg,
    noticeProps: { role: 'status', 'aria-live': 'polite' },
    error: context.err,
    errorProps: { role: 'alert', 'aria-live': 'assertive' },
    listing,
    list: {
      show: !listing && myShares > 0,
      panelTitle: copy.list.panelTitle,
      panelCaption: copy.list.panelCaption,
      sharesFieldLabel: copy.list.sharesField,
      perShareLabel: copy.list.perShare,
      priceSrLabel: copy.list.priceSr,
      disabledReason: listReason,
      sharesInputProps: {
        value: sellShares,
        min: 1,
        max: Math.max(1, myShares),
        step: 1,
        onChange: actions.onSellSharesChange,
      },
      priceInputProps: {
        value: context.price,
        min: 0.01,
        step: 0.01,
        onChange: actions.onPriceChange,
      },
      listButtonLabel: phase === 'listing' ? copy.list.submitting : copy.list.submit,
      listButtonProps: {
        onClick: actions.onList,
        disabled: phase === 'listing' || !!listReason,
        'aria-busy': phase === 'listing',
      },
    },
    sources: (context.stats?.sources ?? []).map((source) => ({
      id: source.source,
      label: source.source,
      viewsLabel: source.views.toLocaleString(),
      linkProps: source.url ? { href: source.url, target: '_blank', rel: 'noreferrer' } : undefined,
    })),
    plex: buildMemeplexPanelModel({
      meme,
      plex: context.plex,
      canEdit: !!user && (meme.creatorId === user.sub || myShares > 0),
      binder: context.plexBinder,
      pick: context.plexPick,
      pasted: context.plexPasted,
      notice: context.plexMsg,
      error: context.plexErr,
      onPickChange: actions.onPlexPickChange,
      onPastedChange: actions.onPlexPastedChange,
      onAdd: actions.onPlexAdd,
    }),
    capTableTitle: copy.capTable.title,
    capTableNote,
    capTable: context.positions.map((position) => ({
      userId: position.userId,
      sharesLabel: `${position.shares}/100`,
      label: holderLabel(position.userId, user?.sub ?? null, context.holderNames, holderNameCache),
    })),
    deleteDialog: buildConfirmDialogModel({
      open: context.confirmingDelete,
      id: 'delete-meme',
      danger: true,
      busy: context.deleting || phase === 'deleting',
      title: copy.deleteDialog.title,
      message: [
        { kind: 'strong' as const, text: copy.quotedTitle(meme.title) },
        copy.deleteDialog.body,
      ],
      confirmLabel: copy.deleteDialog.confirm,
      onCancel: actions.onDeleteCancel,
      onConfirm: actions.onDeleteConfirm,
    }),
    buyDialog: buildConfirmDialogModel({
      open: context.confirmingBuy,
      id: 'buy-shares',
      busy: phase === 'buying',
      title: copy.buyDialog.title(buyTotal),
      message: [
        copy.buyDialog.lead(buyShares),
        { kind: 'strong' as const, text: copy.quotedTitle(meme.title) },
        copy.buyDialog.tail(pricePerShare, held),
      ],
      confirmLabel: copy.buyDialog.confirm(buyShares),
      onCancel: actions.onBuyCancel,
      onConfirm: actions.runBuy,
    }),
    claimDialog: buildConfirmDialogModel({
      open: context.confirmingClaim,
      id: 'claim-meme',
      title: copy.claimDialog.title,
      message: copy.claimDialog.body,
      confirmLabel: copy.claimDialog.confirm,
      prompt: {
        label: copy.claimDialog.prompt.label,
        value: context.claimNote,
        placeholder: copy.claimDialog.prompt.placeholder,
        maxLength: 400,
        hint: copy.claimDialog.prompt.hint,
        onChange: actions.onClaimNoteChange,
      },
      onCancel: actions.onClaimCancel,
      onConfirm: actions.onClaimConfirm,
    }),
  }
}
