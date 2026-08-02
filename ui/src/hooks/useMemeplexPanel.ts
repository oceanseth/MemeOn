import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Meme, Memeplex } from '../types'

/** Extract a meme id from a raw id or a pasted /m/ | /meme/ URL. */
export function parseMemeRef(raw: string): string {
  const t = raw.trim()
  const m = t.match(/\/(?:m|meme)\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : t
}

/**
 * Mechanism for the memeplex panel: visibility gating, the assembled family,
 * and the two ways to link a relative (binder picker, pasted link).
 *
 * Uncontrolled by design — the picker and paste field are transient UI state.
 */
export function useMemeplexPanel({
  meme,
  plex,
  canEdit,
  linkable = [],
  onLink,
}: {
  meme: Meme
  plex: Memeplex | null
  canEdit: boolean
  linkable?: Meme[]
  onLink: (memeId: string) => void
}) {
  const [pick, setPick] = useState('')
  const [pasted, setPasted] = useState('')

  const onPickChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => setPick(e.target.value),
    [],
  )
  const onPastedChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setPasted(e.target.value),
    [],
  )
  const linkPicked = useCallback(() => {
    onLink(pick)
    setPick('')
  }, [onLink, pick])
  const linkPasted = useCallback(() => {
    onLink(parseMemeRef(pasted))
    setPasted('')
  }, [onLink, pasted])

  const ancestorItems = useMemo(() => {
    const ancestors = plex?.ancestors ?? []
    return ancestors.map((a, i) => ({
      id: a.id,
      title: a.title,
      separator: i > 0 ? ' → ' : '',
      linkProps: { to: `/m/${a.id}` },
      isOriginal: !!plex?.original && i === 0 && ancestors[0]?.id === plex.original.id,
    }))
  }, [plex])

  return useMemo(() => {
    const family = plex ? [...plex.remixes, ...plex.related] : []
    const hasAncestors = (plex?.ancestors.length ?? 0) > 0
    return {
      // Nothing to show and nothing to do → the panel stays out of the page.
      visible: !!plex && (family.length > 0 || hasAncestors || canEdit),
      family,
      ancestorItems,
      hasAncestors,
      hasFamily: family.length > 0,
      canEdit,
      pick,
      pasted,
      canLinkPasted: pasted.trim().length > 0,
      options: linkable.filter((m) => m.id !== meme.id),
      emptyMessage: 'No relatives yet — remix this meme or link related ones.',

      selectProps: { value: pick, onChange: onPickChange },
      pastedProps: { value: pasted, onChange: onPastedChange },
      linkPickProps: { onClick: linkPicked },
      linkPastedProps: { onClick: linkPasted },
    }
  }, [
    plex, canEdit, ancestorItems, pick, pasted, linkable, meme.id,
    onPickChange, onPastedChange, linkPicked, linkPasted,
  ])
}
