import type { MouseEventHandler } from 'react'
import type { SortDir, SortKey } from './sorting'

export interface SortChipModel {
  key: SortKey
  label: string
  active: boolean
  arrow: '↓' | '↑' | null
  /** The arrow is decoration; direction is spoken here. */
  directionLabel: 'ascending' | 'descending' | null
  buttonProps: {
    'aria-pressed': boolean
    'aria-label': string
    disabled?: boolean
    onClick: MouseEventHandler<HTMLButtonElement>
  }
}

export interface SortChipsModel {
  chips: readonly SortChipModel[]
  groupProps: {
    role: 'group'
    'aria-label': string
    'aria-describedby'?: string
  }
  /** One sentence explaining why the row is inert, or null while the chips work. */
  reason: string | null
  reasonProps: { id: string }
}

export interface BuildSortChipsModelInput {
  sortKey: SortKey
  dir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
  disabledReason?: string | null
}

const CHIP_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'views', label: '👁️ Views' },
  { key: 'reshares', label: '🔁 Reshares' },
  { key: 'value', label: '🧠 Value' },
]

const REASON_ID = 'sort-chips-reason'

export function buildSortChipsModel({
  sortKey,
  dir,
  onChange,
  disabledReason = null,
}: BuildSortChipsModelInput): SortChipsModel {
  return {
    chips: CHIP_OPTIONS.map(({ key, label }) => {
      const active = key === sortKey
      const directionLabel = active ? (dir === 'desc' ? 'descending' : 'ascending') : null
      return {
        key,
        label,
        active,
        arrow: active ? (dir === 'desc' ? '↓' : '↑') : null,
        directionLabel,
        buttonProps: {
          'aria-pressed': active,
          'aria-label': directionLabel ? `${label}, ${directionLabel}` : label,
          ...(disabledReason ? { disabled: true } : {}),
          onClick: () => {
            onChange(key, active ? (dir === 'desc' ? 'asc' : 'desc') : 'desc')
          },
        },
      }
    }),
    groupProps: {
      role: 'group',
      'aria-label': 'Sort by',
      ...(disabledReason ? { 'aria-describedby': REASON_ID } : {}),
    },
    reason: disabledReason,
    reasonProps: { id: REASON_ID },
  }
}
