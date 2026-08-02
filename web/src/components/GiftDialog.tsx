import { useEffect, useState } from 'react'
import { GiftDialog as GiftDialogView } from '@memeon/ui'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'

/** Container: loads the sender's giftable binder and performs the transfer. */
export function GiftDialog({
  open,
  recipient,
  onClose,
  onGifted,
}: {
  open: boolean
  recipient: { sub: string; name: string } | null
  onClose: () => void
  onGifted: (msg: string) => void
}) {
  const [binder, setBinder] = useState<Meme[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErr(null)
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => (m.myShares ?? 0) > 0)))
      .catch(() => setBinder([]))
  }, [open])

  const send = async (memeId: string, shares: number) => {
    if (!recipient) return
    const pick = binder.find((m) => m.id === memeId)
    setBusy(true)
    setErr(null)
    try {
      await post('/api/gift', { memeId, toSub: recipient.sub, shares })
      onGifted(
        `🎁 Gifted ${shares} share${shares === 1 ? '' : 's'} of "${pick?.title ?? 'meme'}" to ${recipient.name}`,
      )
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'gift failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <GiftDialogView
      open={open}
      recipient={recipient}
      memes={binder}
      busy={busy}
      error={err}
      onClose={onClose}
      onGift={(memeId, shares) => void send(memeId, shares)}
    />
  )
}
