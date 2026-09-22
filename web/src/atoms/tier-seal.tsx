import { Icon, type IconName } from '@/atoms/icon'
import { cn } from '@/lib/cn'

const TIER_KEYS = ['paper', 'silver', 'holo', 'chrome', 'gold', 'prismatic', 'shiny'] as const
type TierSealKey = (typeof TIER_KEYS)[number]

const TIER_SET: ReadonlySet<string> = new Set(TIER_KEYS)

const tierFor = (tierKey: string): TierSealKey =>
  TIER_SET.has(tierKey) ? (tierKey as TierSealKey) : 'paper'

const ICONS: Readonly<Record<TierSealKey, IconName | 'crown'>> = {
  paper: 'star',
  silver: 'star-filled',
  holo: 'sparkles',
  chrome: 'star',
  gold: 'crown',
  prismatic: 'sparkles',
  shiny: 'crown',
}

export interface TierSealProps {
  tierKey: string
  label: string
  className?: string | undefined
}

function CrownMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" data-slot="tier-seal-crown">
      <path d="M3.5 7.5 8.3 12l3.7-7 3.7 7 4.8-4.5-1.4 10H4.9l-1.4-10Z" />
      <path d="M5.1 19.5h13.8" />
    </svg>
  )
}

/** The collectible shell's corner mark. The visible tier name remains in the metadata below. */
export function TierSeal({ tierKey, label, className }: TierSealProps) {
  const tier = tierFor(tierKey)
  const icon = ICONS[tier]

  return (
    <span
      role="img"
      aria-label={label}
      data-slot="tier-seal"
      data-tier={tier}
      className={cn(className)}
    >
      {icon === 'crown' ? <CrownMark /> : <Icon name={icon} size={22} aria-hidden="true" />}
    </span>
  )
}
