import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * The tier seal on a card. The only place besides `foil.css` and the Tokens sheet that names the
 * `tier-*-chip` colours; each skin is a literal so Tailwind's scanner sees it.
 */
const tierChipVariants = cva(
  'inline-flex max-w-full items-center justify-center rounded-sm font-sans font-semibold whitespace-nowrap wrap-anywhere',
  {
    variants: {
      tier: {
        paper: 'bg-tier-paper-chip text-tier-paper-chip-text',
        silver: 'bg-tier-silver-chip text-tier-silver-chip-text',
        holo: 'bg-tier-holo-chip text-tier-holo-chip-text',
        chrome: 'bg-tier-chrome-chip text-tier-chrome-chip-text',
        gold: 'bg-tier-gold-chip text-tier-gold-chip-text',
        /* the flat colour is the gradient's first stop, so the chip still reads without images */
        prismatic:
          'bg-tier-prismatic-chip bg-(image:--gradient-tier-prismatic-chip) text-tier-prismatic-chip-text',
        shiny: 'bg-tier-shiny-chip text-tier-shiny-chip-text',
      },
      size: {
        /** grid thumb */
        sm: 'px-2 py-1 text-xs',
        /** detail hero */
        md: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { tier: 'paper', size: 'sm' },
  },
)

export type TierChipTier = NonNullable<VariantProps<typeof tierChipVariants>['tier']>
export type TierChipSize = NonNullable<VariantProps<typeof tierChipVariants>['size']>

const TIERS: ReadonlySet<string> = new Set<TierChipTier>([
  'paper',
  'silver',
  'holo',
  'chrome',
  'gold',
  'prismatic',
  'shiny',
])

/** cva has no fallback row: an unknown key is a data problem and wears Paper rather than nothing. */
const tierFor = (tierKey: string): TierChipTier =>
  TIERS.has(tierKey) ? (tierKey as TierChipTier) : 'paper'

export interface TierChipProps {
  tierKey: string
  label: string
  size?: TierChipSize | null | undefined
  className?: string | undefined
}

export function TierChip({ tierKey, label, size, className }: TierChipProps) {
  return (
    <span
      data-slot="tier-chip"
      data-tier={tierKey}
      className={cn(tierChipVariants({ tier: tierFor(tierKey), size }), className)}
    >
      {label}
    </span>
  )
}

export { tierChipVariants }
