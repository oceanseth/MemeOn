import { describe, expect, it, vi } from 'vitest'
import { readSale, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { buildAlertsBellModel } from './alertsBellModel'

describe('buildAlertsBellModel', () => {
  it('counts unread alerts and supplies the current disclosure state', () => {
    const model = buildAlertsBellModel({
      alerts: [unreadSale, unreadFriend, readSale], open: true, onOpenChange: vi.fn(),
    })
    expect(model.unreadLabel).toBe('2')
    expect(model.triggerProps['aria-label']).toBe('Alerts')
    expect(model.triggerProps['aria-expanded']).toBe(true)
    expect(model.rows.map((row) => row.unread)).toEqual([true, true, false])
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
    })
    expect(model.rows[0]?.linkProps?.to).toBe(`/m/${unreadSale.memeId}`)
    expect(model.rows[1]?.linkProps?.to).toBe('/u/mask%2Fa%20%2B%20b')
    expect(model.rows[2]?.linkProps).toBeNull()
    expect(model.rows[0]?.timeLabel).toBe(new Date(unreadSale.createdAt).toLocaleString())
  })

  it('omits the unread badge for an empty or fully read inbox', () => {
    const empty = buildAlertsBellModel({ alerts: [], open: false, onOpenChange: vi.fn() })
    const read = buildAlertsBellModel({ alerts: [readSale], open: true, onOpenChange: vi.fn() })
    expect(empty.empty).toBe(true)
    expect(empty.unreadLabel).toBeNull()
    expect(read.empty).toBe(false)
    expect(read.unreadLabel).toBeNull()
  })
})
