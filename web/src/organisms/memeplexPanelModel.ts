import type { ChangeEventHandler, HTMLAttributes, MouseEventHandler } from 'react'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import type { Meme, Memeplex } from '../lib/types'

export interface MemeplexPanelModel {
  show: boolean
  ancestors: readonly { id: string; title: string; linkProps: { to: string } }[]
  showOriginalLabel: boolean
  family: readonly MemeCardModel[]
  canEdit: boolean
  pickerProps: {
    value: string
    'aria-label': string
    onValueChange: (value: string | null) => void
  }
  linkable: readonly { id: string; title: string }[]
  pickLinkButtonProps: { onClick: MouseEventHandler<HTMLButtonElement>; disabled: boolean }
  showPickLink: boolean
  pastedProps: { value: string; 'aria-label': string; onChange: ChangeEventHandler<HTMLInputElement> }
  pastedLinkButtonProps: { onClick: MouseEventHandler<HTMLButtonElement>; disabled: boolean }
  showPastedLink: boolean
  notice: string | null
  error: string | null
  /** live-region containers are mounted before their text arrives */
  noticeProps: Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-live'>
  errorProps: Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-live'>
}

/** Extract a meme id from a raw id or a pasted /m/ | /meme/ URL. */
export function parseMemeRef(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/\/(?:m|meme)\/([^/?#]+)/)
  if (!match) return trimmed
  try {
    return decodeURIComponent(match[1])
  } catch {
    return trimmed
  }
}

export function buildMemeplexPanelModel({
  meme,
  plex,
  canEdit,
  binder,
  pick,
  pasted,
  notice,
  error,
  onPickChange,
  onPastedChange,
  onAdd,
}: {
  meme: Meme
  plex: Memeplex | null
  canEdit: boolean
  binder: readonly Meme[]
  pick: string
  pasted: string
  notice: string | null
  error: string | null
  onPickChange: (id: string) => void
  onPastedChange: (raw: string) => void
  onAdd: (memeId: string) => void
}): MemeplexPanelModel {
  const family = plex ? [...plex.remixes, ...plex.related] : []
  const linked = new Set([
    meme.id,
    ...(plex?.ancestors.map((relative) => relative.id) ?? []),
    ...(plex?.remixes.map((relative) => relative.id) ?? []),
    ...(plex?.related.map((relative) => relative.id) ?? []),
  ])
  const linkable = binder.filter((candidate) => !linked.has(candidate.id))
  const pastedId = parseMemeRef(pasted)

  return {
    show: !!plex && (family.length > 0 || plex.ancestors.length > 0 || canEdit),
    ancestors: (plex?.ancestors ?? []).map((ancestor) => ({
      id: ancestor.id,
      title: ancestor.title,
      linkProps: { to: `/m/${ancestor.id}` },
    })),
    showOriginalLabel: !!plex?.original && plex.ancestors[0]?.id === plex.original.id,
    family: family.map(buildMemeCardModel),
    canEdit,
    pickerProps: {
      value: pick,
      'aria-label': 'Link a meme from your binder',
      onValueChange: (value) => onPickChange(value ?? ''),
    },
    linkable: linkable.map((candidate) => ({ id: candidate.id, title: candidate.title })),
    pickLinkButtonProps: { onClick: () => onAdd(pick), disabled: !pick },
    showPickLink: !!pick,
    pastedProps: { value: pasted, 'aria-label': 'Paste a meme link', onChange: (event) => onPastedChange(event.target.value) },
    pastedLinkButtonProps: { onClick: () => onAdd(pastedId), disabled: !pastedId },
    showPastedLink: !!pasted.trim(),
    notice,
    error,
    noticeProps: { role: 'status', 'aria-live': 'polite' },
    errorProps: { role: 'alert', 'aria-live': 'assertive' },
  }
}
