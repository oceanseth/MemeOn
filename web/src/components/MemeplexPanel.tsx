import { useCallback, useEffect, useMemo, useState } from 'react'
import { MemeplexPanel as MemeplexPanelView } from '@memeon/ui'
import { apiFetch, post } from '../lib/api'
import type { Meme, Memeplex } from '../lib/types'

/** Container: loads the memeplex and the binder memes that can be linked. */
export function MemeplexPanel({ meme, canEdit }: { meme: Meme; canEdit: boolean }) {
  const [plex, setPlex] = useState<Memeplex | null>(null)
  const [binder, setBinder] = useState<Meme[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<Memeplex>(`/api/memes/${meme.id}/memeplex`)
      .then(setPlex)
      .catch(() => {})
  }, [meme.id])

  useEffect(load, [load])

  useEffect(() => {
    if (!canEdit) return
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => m.id !== meme.id)))
      .catch(() => {})
  }, [canEdit, meme.id])

  // never offer the meme itself or anything already in the family
  const alreadyLinked = useMemo(
    () =>
      new Set([
        meme.id,
        ...(plex?.ancestors ?? []).map((m) => m.id),
        ...(plex?.remixes ?? []).map((m) => m.id),
        ...(plex?.related ?? []).map((m) => m.id),
      ]),
    [meme.id, plex],
  )

  const link = async (memeId: string) => {
    setMsg(null)
    if (alreadyLinked.has(memeId)) {
      setMsg(
        memeId === meme.id
          ? "That's this meme — already the center of its own memeplex."
          : 'Already in the memeplex.',
      )
      return
    }
    try {
      await post(`/api/memes/${meme.id}/memeplex`, { memeId })
      setMsg('Added to the memeplex 🕸️')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'failed to add')
    }
  }

  return (
    <MemeplexPanelView
      meme={meme}
      plex={plex}
      canEdit={canEdit}
      linkable={binder.filter((m) => !alreadyLinked.has(m.id))}
      message={msg}
      onLink={(memeId) => void link(memeId)}
    />
  )
}
