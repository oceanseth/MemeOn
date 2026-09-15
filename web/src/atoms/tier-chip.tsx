import { cn } from '../lib/cn'

/** `sm` grid thumb · `md` detail hero. */
export type TierChipSize = 'sm' | 'md'

/** Literal class names so Tailwind scans them; unknown tiers fall back to Paper. */
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

const skinFor = (tierKey: string): string => TIER_SKIN[tierKey] ?? (TIER_SKIN['paper'] as string)

const CHIP = cn(
  'inline-flex max-w-full items-center justify-center rounded-chip font-sans font-bold',
  'whitespace-nowrap [overflow-wrap:anywhere]',
)

const SIZES: Record<TierChipSize, string> = {
  sm: 'px-chip-x py-1 text-micro',
  md: 'px-2.75 py-1.25 text-caption',
}

export interface TierChipProps {
  tierKey: string
  label: string
  size?: TierChipSize | undefined
  className?: string | undefined
}

export function TierChip({ tierKey, label, size = 'sm', className }: TierChipProps) {
  return (
    <span data-slot="tier-chip" data-tier={tierKey} className={cn(CHIP, SIZES[size], skinFor(tierKey), className)}>
      {label}
    </span>
  )
}
