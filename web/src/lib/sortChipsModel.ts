import type { MouseEventHandler } from 'react'
import type { SortDir, SortKey } from './sorting'

export interface SortChipModel {
  key: SortKey
  label: string
  active: boolean
  arrow: '↓' | '↑' | null
  buttonProps: {
    'aria-pressed': boolean
    onClick: MouseEventHandler<HTMLButtonElement>
  }
}

export interface SortChipsModel {
  chips: readonly SortChipModel[]
}

export interface BuildSortChipsModelInput {
  sortKey: SortKey
  dir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}

const CHIP_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'views', label: '👁️ Views' },
  { key: 'reshares', label: '🔁 Reshares' },
  { key: 'value', label: '🧠 Value' },
]

export function buildSortChipsModel({
  sortKey,
  dir,
  onChange,
}: BuildSortChipsModelInput): SortChipsModel {
  return {
    chips: CHIP_OPTIONS.map(({ key, label }) => {
      const active = key === sortKey
      return {
        key,
        label,
        active,
        arrow: active ? (dir === 'desc' ? '↓' : '↑') : null,
        buttonProps: {
          'aria-pressed': active,
          onClick: () => {
            onChange(key, active ? (dir === 'desc' ? 'asc' : 'desc') : 'desc')
          },
        },
      }
    }),
  }
}
