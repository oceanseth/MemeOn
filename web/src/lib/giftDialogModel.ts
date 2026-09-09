import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  MouseEventHandler,
} from 'react'
import type { Meme } from './types'

export type GiftRecipient = { sub: string; name: string }

export interface GiftDialogRowModel {
  id: string
  title: string
  selected: boolean
  sharesLabel: string
  imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>
  buttonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
}

export interface GiftDialogModel {
  open: boolean
  recipientName: string | null
  overlayProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick'>
  dialogProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role' | 'aria-modal' | 'aria-labelledby'>
  searchInputProps: Pick<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>
  rows: readonly GiftDialogRowModel[]
  showEmpty: boolean
  showControls: boolean
  maxShares: number
  sharesInputProps: Pick<InputHTMLAttributes<HTMLInputElement>, 'value' | 'min' | 'max' | 'onChange'>
  submitLabel: string
  submitButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  error: string | null
}

export interface BuildGiftDialogModelInput {
  open: boolean
  recipient: GiftRecipient | null
  memes: readonly Meme[]
  query: string
  pick: Meme | null
  shares: number
  busy: boolean
  error: string | null
  onClose: () => void
  onQueryChange: (query: string) => void
  onPick: (meme: Meme) => void
  onSharesChange: (shares: number) => void
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
  busy,
  error,
  onClose,
  onQueryChange,
  onPick,
  onSharesChange,
  onSubmit,
}: BuildGiftDialogModelInput): GiftDialogModel {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const rows = memes
    .filter((meme) => !normalizedQuery || meme.title.toLocaleLowerCase().includes(normalizedQuery))
    .map((meme) => ({
      id: meme.id,
      title: meme.title,
      selected: pick?.id === meme.id,
      sharesLabel: `${meme.myShares ?? 0}/100`,
      imageProps: { src: meme.imageUrl, alt: '' },
      buttonProps: { onClick: () => onPick(meme) },
    }))
  const maxShares = Math.max(1, pick?.myShares ?? 1)
  const normalizedShares = clampGiftShares(shares, maxShares)
  const canSubmit = !!recipient && !!pick && !busy && normalizedShares <= maxShares
  const stopPropagation: MouseEventHandler<HTMLDivElement> = (event) => event.stopPropagation()
  const onSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => onQueryChange(event.target.value)
  const onShareChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    onSharesChange(clampGiftShares(event.target.value, maxShares))

  return {
    open: open && !!recipient,
    recipientName: recipient?.name ?? null,
    overlayProps: { onClick: onClose },
    dialogProps: {
      onClick: stopPropagation,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': 'gift-dialog-title',
    },
    searchInputProps: { value: query, onChange: onSearchChange },
    rows,
    showEmpty: rows.length === 0,
    showControls: !!pick,
    maxShares,
    sharesInputProps: {
      value: normalizedShares,
      min: 1,
      max: maxShares,
      onChange: onShareChange,
    },
    submitLabel: busy ? 'Gifting…' : pick ? `Gift ${normalizedShares} of "${pick.title}"` : 'Choose a meme to gift',
    submitButtonProps: { onClick: onSubmit, disabled: !canSubmit },
    error,
  }
}
