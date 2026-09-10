import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  FocusEventHandler,
  ImgHTMLAttributes,
  InputHTMLAttributes,
} from 'react'
import type { Meme } from './types'

export type GiftRecipient = { sub: string; name: string }

export interface GiftDialogRowModel {
  id: string
  title: string
  selected: boolean
  sharesLabel: string
  tierKey: string
  tierLabel: string
  tierColor: string
  listed: boolean
  listedLabel: string
  imageProps: Pick<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'loading' | 'decoding' | 'width' | 'height'
  >
  buttonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-pressed' | 'disabled'
  >
}

export interface GiftDialogModel {
  open: boolean
  /** unique per dialog on the page; the frame builds its portal anchor from it */
  id: string
  recipientName: string | null
  title: string
  titleId: string
  hint: string
  hintId: string
  /** every control locks while the transfer runs, and so does every exit */
  busy: boolean
  /**
   * The single dismissal channel Base UI reports into: Escape, a press on the scrim and the ✕ all
   * arrive as `false`. In flight it is a no-op, so the transfer owns the dialog until it answers.
   */
  onOpenChange: (open: boolean) => void
  /** accessible name for the ✕; the dialog's only exit for a screen reader on a touch device */
  closeLabel: string
  cancelLabel: string
  cancelButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  searchInputProps: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'aria-label' | 'disabled'
  >
  rows: readonly GiftDialogRowModel[]
  showEmpty: boolean
  emptyMessage: string
  showControls: boolean
  maxShares: number
  sharesLabel: string
  sharesMaxLabel: string
  sharesInputProps: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'min' | 'max' | 'onChange' | 'onBlur' | 'aria-label' | 'disabled'
  >
  submitLabel: string
  submitButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'disabled' | 'aria-busy'
  >
  error: string | null
}

export interface BuildGiftDialogModelInput {
  open: boolean
  recipient: GiftRecipient | null
  memes: readonly Meme[]
  query: string
  pick: Meme | null
  shares: number
  /** raw text the user is typing into the share field; null shows the clamped number */
  sharesInput?: string | null
  busy: boolean
  error: string | null
  onClose: () => void
  onQueryChange: (query: string) => void
  onPick: (meme: Meme) => void
  /** raw field text, so select-all-and-retype survives; clamping happens on blur and at submit */
  onSharesChange: (rawValue: string) => void
  onSharesBlur?: () => void
  onSubmit: () => void
}

export function clampGiftShares(value: unknown, maxShares: number): number {
  const maximum = Math.max(1, Math.floor(maxShares))
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.min(maximum, Math.floor(parsed)))
}

/** Builds all DOM behavior and derived display values for the pure gift dialog. */
export function buildGiftDialogModel({
  open,
  recipient,
  memes,
  query,
  pick,
  shares,
  sharesInput = null,
  busy,
  error,
  onClose,
  onQueryChange,
  onPick,
  onSharesChange,
  onSharesBlur,
  onSubmit,
}: BuildGiftDialogModelInput): GiftDialogModel {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const rows = memes
    .filter((meme) => !normalizedQuery || meme.title.toLocaleLowerCase().includes(normalizedQuery))
    .map((meme) => ({
      id: meme.id,
      title: meme.title,
      selected: pick?.id === meme.id,
      sharesLabel: `you hold ${meme.myShares ?? 0} of 100`,
      tierKey: meme.tier.key,
      tierLabel: meme.tier.name,
      tierColor: meme.tier.color,
      listed: !!meme.listing && meme.listing.shares > 0,
      listedLabel: 'Listed',
      imageProps: {
        src: meme.imageUrl,
        alt: '',
        loading: 'lazy' as const,
        decoding: 'async' as const,
        width: 40,
        height: 40,
      },
      // in flight the transfer owns the dialog: re-picking here would relabel a submit that is already running
      buttonProps: {
        onClick: () => onPick(meme),
        'aria-pressed': pick?.id === meme.id,
        disabled: busy,
      },
    }))
  const maxShares = Math.max(1, pick?.myShares ?? 1)
  const normalizedShares = clampGiftShares(shares, maxShares)
  const canSubmit = !!recipient && !!pick && !busy && normalizedShares <= maxShares
  const dismiss = () => {
    if (!busy) onClose()
  }
  const onSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => onQueryChange(event.target.value)
  const onShareChange: ChangeEventHandler<HTMLInputElement> = (event) => onSharesChange(event.target.value)
  const onShareBlur: FocusEventHandler<HTMLInputElement> = () => onSharesBlur?.()

  return {
    open: open && !!recipient,
    id: 'gift-dialog',
    recipientName: recipient?.name ?? null,
    title: `🎁 Gift to ${recipient?.name ?? ''}`,
    titleId: 'gift-dialog-title',
    hint: 'Pick a meme you hold shares in — the transfer is free and instant.',
    hintId: 'gift-dialog-hint',
    busy,
    // Escape, the scrim and the ✕ are Base UI's to detect; dismiss() is a no-op while busy, so
    // every exit says so instead of looking operable
    onOpenChange: (nextOpen) => {
      if (!nextOpen) dismiss()
    },
    closeLabel: 'Close gift dialog',
    cancelLabel: 'Cancel',
    cancelButtonProps: { onClick: dismiss, disabled: busy },
    searchInputProps: {
      value: query,
      onChange: onSearchChange,
      'aria-label': 'Search your binder',
      disabled: busy,
    },
    rows,
    showEmpty: rows.length === 0,
    emptyMessage: normalizedQuery
      ? `Nothing in your binder matches "${query.trim()}".`
      : 'Nothing to gift here — you need shares in a meme first.',
    showControls: !!pick,
    maxShares,
    sharesLabel: 'shares',
    sharesMaxLabel: `of ${maxShares}`,
    sharesInputProps: {
      value: sharesInput ?? normalizedShares,
      min: 1,
      max: maxShares,
      onChange: onShareChange,
      onBlur: onShareBlur,
      'aria-label': `Shares to gift, up to ${maxShares}`,
      disabled: busy,
    },
    submitLabel: busy ? 'Gifting…' : pick ? `Gift ${normalizedShares} of "${pick.title}"` : 'Choose a meme to gift',
    submitButtonProps: { onClick: onSubmit, disabled: !canSubmit, 'aria-busy': busy },
    error,
  }
}
