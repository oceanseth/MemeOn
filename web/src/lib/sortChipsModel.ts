import type { SortDir, SortKey } from './sorting'

export interface SortChipModel {
  key: SortKey
  label: string
  /** the one chip that owns the current sort */
  selected: boolean
  /** which way the selected chip sorts; null on the others */
  direction: SortDir | null
  arrow: '↓' | '↑' | null
  /** The arrow is decoration; direction is spoken here. */
  directionLabel: 'ascending' | 'descending' | null
  buttonProps: { 'aria-label': string }
}

export interface SortChipsModel {
  chips: readonly SortChipModel[]
  /** the sort the row is showing, as state rather than as a class name */
  selected: SortKey
  direction: SortDir
  /** the whole row is inert while the API cannot rank */
  disabled: boolean
  groupProps: {
    role: 'group'
    'aria-label': string
    'aria-describedby'?: string
  }
  /** a chip that was not selected: sort by it, biggest first */
  select: (key: SortKey) => void
  /** the selected chip pressed again: same key, other way */
  flip: () => void
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
      const selected = key === sortKey
      const directionLabel = selected ? (dir === 'desc' ? 'descending' : 'ascending') : null
      return {
        key,
        label,
        selected,
        direction: selected ? dir : null,
        arrow: selected ? (dir === 'desc' ? '↓' : '↑') : null,
        directionLabel,
        buttonProps: {
          'aria-label': directionLabel ? `${label}, ${directionLabel}` : label,
        },
      }
    }),
    selected: sortKey,
    direction: dir,
    disabled: !!disabledReason,
    groupProps: {
      role: 'group',
      'aria-label': 'Sort by',
      ...(disabledReason ? { 'aria-describedby': REASON_ID } : {}),
    },
    select: (key) => onChange(key, 'desc'),
    flip: () => onChange(sortKey, dir === 'desc' ? 'asc' : 'desc'),
    reason: disabledReason,
    reasonProps: { id: REASON_ID },
  }
}
