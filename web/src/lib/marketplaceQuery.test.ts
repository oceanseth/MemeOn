import { describe, expect, it, vi } from 'vitest'
import { marketplaceCopy as copy } from '../copy/marketplace'
import {
  MARKETPLACE_PAGE_SIZE,
  buildMarketFilterTabs,
  filtersFromUrl,
  queryString,
  writeFilter,
} from './marketplaceQuery'

function writeLive(live: {
  q: string
  type: string
  tier: string
  listed: boolean
  sortKey: string
  sortDir: string
}): URLSearchParams {
  const next = new URLSearchParams()
  writeFilter(next, 'q', live.q)
  writeFilter(next, 'type', live.type)
  writeFilter(next, 'tier', live.tier)
  writeFilter(next, 'listed', live.listed ? 'true' : '')
  writeFilter(next, 'sort', live.sortKey, 'new')
  writeFilter(next, 'dir', live.sortDir, 'desc')
  return next
}

describe('marketplaceQuery URL codec', () => {
  it('round-trips filtersFromUrl through writeFilter, including non-default sort', () => {
    const live = {
      q: 'cats',
      type: 'image',
      tier: 'holo',
      listed: true,
      sortKey: 'views',
      sortDir: 'asc',
    }
    expect(filtersFromUrl(writeLive(live))).toEqual(live)
  })

  it('omits empty q/type/tier, listed false, and the default sort=new dir=desc', () => {
    const params = writeLive({
      q: '',
      type: '',
      tier: '',
      listed: false,
      sortKey: 'new',
      sortDir: 'desc',
    })
    expect([...params.keys()]).toEqual([])
    expect(filtersFromUrl(params)).toEqual({ q: '', type: '', tier: '', listed: false })
  })

  it('writes listed=true and ignores invalid sort/dir', () => {
    const listed = writeLive({
      q: '',
      type: '',
      tier: '',
      listed: true,
      sortKey: 'new',
      sortDir: 'desc',
    })
    expect(listed.get('listed')).toBe('true')
    expect(listed.has('sort')).toBe(false)
    expect(listed.has('dir')).toBe(false)
    expect(filtersFromUrl(listed).listed).toBe(true)

    expect(filtersFromUrl(new URLSearchParams('sort=hot&dir=sideways'))).toEqual({
      q: '',
      type: '',
      tier: '',
      listed: false,
    })
  })

  it('queryString sets limit=60, never sort/dir, and includes q/type/tier/listed when set', () => {
    expect(MARKETPLACE_PAGE_SIZE).toBe(60)
    expect(queryString({ q: '', type: '', tier: '', listed: false })).toBe('limit=60')

    const params = new URLSearchParams(
      queryString({ q: 'cats', type: 'video', tier: 'gold', listed: true }),
    )
    expect(params.get('limit')).toBe('60')
    expect(params.get('q')).toBe('cats')
    expect(params.get('type')).toBe('video')
    expect(params.get('tier')).toBe('gold')
    expect(params.get('listed')).toBe('true')
    expect(params.has('sort')).toBe(false)
    expect(params.has('dir')).toBe(false)
    expect(params.has('cursor')).toBe(false)
  })
})

describe('buildMarketFilterTabs', () => {
  it('maps all ↔ empty type, presses image/video keys, and toggles listed', () => {
    const onTypeChange = vi.fn()
    const onListedChange = vi.fn()
    const all = buildMarketFilterTabs({
      type: '',
      listed: false,
      onTypeChange,
      onListedChange,
    })

    expect(all.media.map((tab) => tab.key)).toEqual(['all', 'image', 'video'])
    expect(all.media.find((tab) => tab.key === 'all')).toMatchObject({
      pressed: true,
      label: copy.filters.media.all,
    })
    expect(all.media.find((tab) => tab.key === 'image')?.pressed).toBe(false)
    expect(all.mediaGroupProps.value).toEqual(['all'])
    expect(all.mediaGroupProps['aria-label']).toBe(copy.filters.media.groupLabel)
    expect(all.listed).toMatchObject({ label: copy.filters.listed, pressed: false })

    all.mediaGroupProps.onValueChange(['image'])
    expect(onTypeChange).toHaveBeenLastCalledWith('image')
    all.listed.onPressedChange(true)
    expect(onListedChange).toHaveBeenLastCalledWith(true)

    const image = buildMarketFilterTabs({
      type: 'image',
      listed: true,
      onTypeChange,
      onListedChange,
    })
    expect(image.media.find((tab) => tab.key === 'image')?.pressed).toBe(true)
    expect(image.mediaGroupProps.value).toEqual(['image'])
    expect(image.listed.pressed).toBe(true)
    // deselecting the pressed media item is "show everything"
    image.mediaGroupProps.onValueChange([])
    expect(onTypeChange).toHaveBeenLastCalledWith('')
    image.mediaGroupProps.onValueChange(['all'])
    expect(onTypeChange).toHaveBeenLastCalledWith('')

    const video = buildMarketFilterTabs({
      type: 'video',
      listed: false,
      onTypeChange,
      onListedChange,
    })
    expect(video.media.find((tab) => tab.key === 'video')?.pressed).toBe(true)
    video.mediaGroupProps.onValueChange(['video'])
    expect(onTypeChange).toHaveBeenLastCalledWith('video')
  })
})
