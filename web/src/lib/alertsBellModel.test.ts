import { describe, expect, it, vi } from 'vitest'
import { FIXED_NOW, readSale, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { alertsBellCopy as copy } from '../copy/alertsBell'
import { buildAlertsBellModel, formatWhen } from './alertsBellModel'

const NOW = new Date(FIXED_NOW).getTime()

describe('buildAlertsBellModel', () => {
  it('counts unread alerts and supplies the current disclosure state', () => {
    const onOpenChange = vi.fn()
    const model = buildAlertsBellModel({
      alerts: [unreadSale, unreadFriend, readSale], open: true, onOpenChange,
    })
    expect(model.unreadLabel).toBe('2')
    expect(model.triggerProps['aria-label']).toBe(copy.trigger(2))
    /* `aria-expanded`, `aria-haspopup` and `aria-controls` are Base UI's — the model carries the
       state the popover is driven by, and the name the bell glyph cannot give it */
    expect(model.open).toBe(true)
    expect(model.onOpenChange).toBe(onOpenChange)
    expect(model.popupProps['aria-label']).toBe(copy.title)
    expect(model.badgeProps['aria-hidden']).toBe(true)
    expect(model.rows.map((row) => row.unread)).toEqual([true, true, false])
    expect(model.rows.map((row) => row.statusLabel)).toEqual([copy.unreadRow, copy.unreadRow, null])
    expect(model.empty).toBe(false)
  })

  it('prioritizes meme targets, encodes profile targets, and formats alert time', () => {
    const model = buildAlertsBellModel({
      alerts: [
        { ...unreadSale, subjectSub: 'mask/a + b' },
        { ...unreadFriend, subjectSub: 'mask/a + b' },
        { ...readSale, memeId: null, subjectSub: null },
      ],
      open: true,
      onOpenChange: vi.fn(),
      now: NOW,
    })
    expect(model.rows[0]?.linkProps?.to).toBe(`/m/${unreadSale.memeId}`)
    expect(model.rows[1]?.linkProps?.to).toBe('/u/mask%2Fa%20%2B%20b')
    expect(model.rows[2]?.linkProps).toBeNull()
    expect(model.rows[0]?.timeLabel).toBe(copy.justNow)
    expect(model.rows[0]?.timeProps).toEqual({
      dateTime: unreadSale.createdAt,
      title: new Date(unreadSale.createdAt).toLocaleString(),
    })
  })

  it('reports recency in the unit a notification list needs', () => {
    expect(formatWhen(FIXED_NOW, NOW + 20_000)).toBe(copy.justNow)
    expect(formatWhen(FIXED_NOW, NOW + 5 * 60_000)).toBe('5 minutes ago')
    expect(formatWhen(FIXED_NOW, NOW + 3 * 3_600_000)).toBe('3 hours ago')
    expect(formatWhen(FIXED_NOW, NOW + 4 * 86_400_000)).toBe(
      new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(NOW),
    )
    expect(formatWhen('not a date')).toBe('')
  })

  it('keeps alerts that were unread when the popover opened marked as unread', () => {
    const model = buildAlertsBellModel({
      alerts: [unreadSale, unreadFriend, readSale].map((alert) => ({ ...alert, read: true })),
      open: true,
      onOpenChange: vi.fn(),
      wasUnread: [unreadSale.id, unreadFriend.id],
    })
    expect(model.unreadLabel).toBeNull()
    expect(model.rows.map((row) => row.unread)).toEqual([true, true, false])
  })

  it('caps the badge and the list, and says so when it truncates', () => {
    const flood = Array.from({ length: 120 }, (_, index) => ({
      ...unreadSale,
      id: `alert-${index}`,
    }))
    const model = buildAlertsBellModel({ alerts: flood, open: true, onOpenChange: vi.fn() })
    expect(model.unreadLabel).toBe('99+')
    expect(model.triggerProps['aria-label']).toBe(copy.trigger(120))
    expect(model.rows).toHaveLength(20)
    expect(model.overflowLabel).toBe(copy.overflow(20))
  })

  it('omits the unread badge for an empty or fully read inbox, and names a failed load', () => {
    const empty = buildAlertsBellModel({ alerts: [], open: false, onOpenChange: vi.fn() })
    const read = buildAlertsBellModel({ alerts: [readSale], open: true, onOpenChange: vi.fn() })
    const offline = buildAlertsBellModel({ alerts: [], open: true, onOpenChange: vi.fn(), failed: true })
    expect(empty.empty).toBe(true)
    expect(empty.unreadLabel).toBeNull()
    expect(empty.emptyLabel).toBe(copy.empty)
    expect(empty.overflowLabel).toBeNull()
    expect(read.empty).toBe(false)
    expect(read.unreadLabel).toBeNull()
    expect(offline.emptyLabel).toBe(copy.offline)
  })
})
