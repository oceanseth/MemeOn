/**
 * `25k` — a displayed magnitude. Under 1,000 stays exact (`999`).
 * `25,182` → `25k`, `250,000` → `250k`, `1,500` → `1.5k`, `1,500,000` → `1.5m`.
 * Prices, balances, and spoken names stay on the exact grouped count.
 */
export function humanize(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 1000) return sign + formatSmall(abs)
  return sign + formatCompact(abs)
}

const SUFFIXES = ['k', 'm', 'b', 't'] as const

function formatSmall(abs: number): string {
  return Number.isInteger(abs) ? String(abs) : String(abs)
}

function formatCompact(abs: number): string {
  let div = 1000
  for (let i = 0; i < SUFFIXES.length; i++) {
    const scaled = abs / div
    const digits = scaled < 10 ? 1 : 0
    const rounded = roundHalfUp(scaled, digits)
    const last = i === SUFFIXES.length - 1
    if (!last && rounded >= 1000) {
      div *= 1000
      continue
    }
    if (digits === 1 && rounded >= 10) {
      return `${roundHalfUp(scaled, 0)}${SUFFIXES[i]}`
    }
    return `${trimTrailingZero(rounded)}${SUFFIXES[i]}`
  }
  return String(abs)
}

/** Drop a trailing `.0` so `1.0` prints as `1`. */
function trimTrailingZero(rounded: number): string {
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(1)
}

function roundHalfUp(value: number, digits: number): number {
  const factor = 10 ** digits
  const scaled = Number((value * factor).toPrecision(15))
  return Math.round(scaled) / factor
}
