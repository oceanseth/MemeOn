/** Labels for the marketplace sort chip row. */
export const sortChipsCopy = {
  group: 'Sort by',
  chips: {
    new: 'Newest',
    views: '👁️ Views',
    reshares: '🔁 Reshares',
    value: '🧠 Value',
  },
  direction: {
    ascending: 'ascending' as const,
    descending: 'descending' as const,
  },
  chipA11y: (label: string, direction: 'ascending' | 'descending' | null) =>
    direction ? `${label}, ${direction}` : label,
} as const
