import { describe, expect, it } from 'vitest'
import { tierFor } from '@memeon/shared/tiers'
import { memeDetailCopy as copy } from '../copy/memeDetail'
import { memeplexPanelCopy } from '../copy/memeplexPanel'
import { buildMemeplexPanelModel } from './memeplexPanelModel'
import type { Meme } from './types'

const meme: Meme = {
  id: 'meme-a',
  title: 'A',
  description: null,
  mediaType: 'image',
  imageUrl: 'https://example.test/a.png',
  videoUrl: null,
  tags: [],
  creatorId: 'creator',
  creatorName: 'Creator',
  ownerId: 'creator',
  ownerName: 'Creator',
  reshares: 0,
  tierKey: 'paper',
  listing: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  tier: tierFor(0),
  value: 1,
}

const handlers = {
  onPickChange: () => {},
  onPastedChange: () => {},
  onAdd: () => {},
}

describe('buildMemeplexPanelModel', () => {
  it('shows the panel when plex is missing but an error is set', () => {
    const model = buildMemeplexPanelModel({
      meme,
      plex: null,
      canEdit: false,
      binder: [],
      pick: '',
      pasted: '',
      notice: null,
      error: copy.memeplex.loadFailed,
      ...handlers,
    })
    expect(model.show).toBe(true)
    expect(model.error).toBe(copy.memeplex.loadFailed)
  })

  it('stays hidden when plex and error are both missing', () => {
    const model = buildMemeplexPanelModel({
      meme,
      plex: null,
      canEdit: false,
      binder: [],
      pick: '',
      pasted: '',
      notice: null,
      error: null,
      ...handlers,
    })
    expect(model.show).toBe(false)
  })

  it('fills heading, empty, placeholders, and link label from copy', () => {
    const model = buildMemeplexPanelModel({
      meme,
      plex: { original: null, ancestors: [], remixes: [], related: [] },
      canEdit: true,
      binder: [],
      pick: '',
      pasted: '',
      notice: null,
      error: null,
      ...handlers,
    })
    expect(model.heading).toBe(memeplexPanelCopy.heading)
    expect(model.descendedFrom).toBe(memeplexPanelCopy.descendedFrom)
    expect(model.empty).toBe(memeplexPanelCopy.empty)
    expect(model.linkLabel).toBe(memeplexPanelCopy.link)
    expect(model.pickPlaceholder).toEqual({ value: '', label: memeplexPanelCopy.pickerPlaceholder })
    expect(model.pastedProps.placeholder).toBe(memeplexPanelCopy.pastedPlaceholder)
    expect(model.pastedProps['aria-label']).toBe(memeplexPanelCopy.pasted)
    expect(model.pickerProps['aria-label']).toBe(memeplexPanelCopy.picker)
  })
})
