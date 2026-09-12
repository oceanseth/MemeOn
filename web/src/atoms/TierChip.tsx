import { cn } from '../lib/cn'

/** `sm` is the grid thumb's chip; `md` is the detail hero's. */
export type TierChipSize = 'sm' | 'md'

/**
 * The rarity seal: the one place a tier says its own name. Colour is entirely token-driven
 * (`--color-tier-<key>-chip` / `-chip-text`, `plan-buckets.md` › tier-system), so every tier reads
 * as itself in both themes and bubblegum stays reserved for Shiny and for actions.
 *
 * Literal class names, not interpolated ones: Tailwind scans this file as text, so
 * `bg-tier-${key}-chip` would never be emitted. Prismatic wears its gradient over the flat chip
 * colour, which stays as the fallback an engine without the custom property paints.
 */
const TIER_SKIN: Record<string, string> = {
  paper: 'bg-tier-paper-chip text-tier-paper-chip-text',
  silver: 'bg-tier-silver-chip text-tier-silver-chip-text',
  holo: 'bg-tier-holo-chip text-tier-holo-chip-text',
  chrome: 'bg-tier-chrome-chip text-tier-chrome-chip-text',
  gold: 'bg-tier-gold-chip text-tier-gold-chip-text',
  prismatic: cn(
    'bg-tier-prismatic-chip bg-(image:--gradient-tier-prismatic-chip)',
    'text-tier-prismatic-chip-text',
  ),
  shiny: 'bg-tier-shiny-chip text-tier-shiny-chip-text',
}

/* A tier the ladder does not know about is a data problem, not a render problem: it wears Paper. */
const skinFor = (tierKey: string): string => TIER_SKIN[tierKey] ?? (TIER_SKIN['paper'] as string)

const CHIP = cn(
  'inline-flex max-w-full items-center justify-center rounded-chip font-sans font-bold',
  'whitespace-nowrap [overflow-wrap:anywhere]',
)

const SIZES: Record<TierChipSize, string> = {
  /* 4/9 padding and 12/16 type, exactly as the board draws the chip on a 340px card */
  sm: 'px-[9px] py-1 text-micro',
  md: 'px-[11px] py-[5px] text-caption',
}

export interface TierChipProps {
  /** `paper` … `shiny` — the key from `shared/tiers.ts` */
  tierKey: string
  /** the tier's product name: Paper, Silver, Holo, Chrome, Gold, Prismatic, Shiny */
  label: string
  size?: TierChipSize | undefined
  /** the host's box model — a card pins the chip into its image frame */
  className?: string | undefined
}

export function TierChip({ tierKey, label, size = 'sm', className }: TierChipProps) {
  return (
    <span data-slot="tier-chip" data-tier={tierKey} className={cn(CHIP, SIZES[size], skinFor(tierKey), className)}>
      {label}
    </span>
  )
}
