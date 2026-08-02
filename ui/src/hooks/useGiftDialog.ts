import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import type { Meme } from '../types'

/**
 * Mechanism for the gift picker: search text, selection, share-count clamping,
 * and the reset that fires when the dialog reopens.
 *
 * Uncontrolled by design — search text and selection are transient UI state.
 * The host owns only the meme list and the transfer itself.
 */
export function useGiftDialog({
  open,
  recipient,
  memes,
  busy = false,
  onClose,
  onGift,
}: {
  open: boolean
  recipient: { sub: string; name: string } | null
  memes: Meme[]
  busy?: boolean
  onClose: () => void
  onGift: (memeId: string, shares: number) => void
}) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Meme | null>(null)
  const [shares, setShares] = useState(1)

  useEffect(() => {
    if (!open) return
    setPick(null)
    setQ('')
    setShares(1)
  }, [open])

  const stopPropagation = useCallback((e: MouseEvent) => e.stopPropagation(), [])
  const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value), [])

  const matches = useMemo(
    () => memes.filter((m) => !q.trim() || m.title.toLowerCase().includes(q.toLowerCase())),
    [memes, q],
  )

  const maxShares = pick?.myShares ?? 0

  const onSharesChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setShares(Math.max(1, Math.min(maxShares, Math.floor(Number(e.target.value) || 1)))),
    [maxShares],
  )

  const rows = useMemo(
    () =>
      matches.map((m) => ({
        id: m.id,
        title: m.title,
        picked: pick?.id === m.id,
        sharesLabel: `${m.myShares}/100`,
        thumbProps: { src: m.imageUrl, alt: '' },
        buttonProps: {
          onClick: () => {
            setPick(m)
            setShares((s) => Math.min(s, m.myShares ?? 1))
          },
        },
      })),
    [matches, pick],
  )

  const onSubmit = useCallback(() => {
    if (pick) onGift(pick.id, shares)
  }, [pick, shares, onGift])

  return useMemo(
    () => ({
      isOpen: open && !!recipient,
      recipientName: recipient?.name ?? '',
      hasPick: !!pick,
      maxShares,
      shares,
      rows,
      isEmpty: rows.length === 0,
      submitLabel: busy ? 'Gifting…' : `Gift ${shares} of "${pick?.title ?? ''}"`,

      overlayProps: { onClick: onClose },
      modalProps: { onClick: stopPropagation },
      searchProps: { value: q, onChange: onSearchChange },
      sharesInputProps: { min: 1, max: maxShares, value: shares, onChange: onSharesChange },
      submitProps: { onClick: onSubmit, disabled: busy },
    }),
    [
      open, recipient, pick, maxShares, shares, rows, busy, q,
      onClose, stopPropagation, onSearchChange, onSharesChange, onSubmit,
    ],
  )
}
