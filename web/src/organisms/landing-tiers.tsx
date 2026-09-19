import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { Heading } from '@/atoms/heading'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

const SECTION = 'mt-14 max-md:mt-10'

/** Virality ladder: one ordered climb, each rung a foil specimen. */
export function LandingTiers({
  tiersTitle,
  tiers,
  frameImageProps,
  frameSlotProps,
}: Pick<LandingScreenModel, 'tiersTitle' | 'tiers' | 'frameImageProps' | 'frameSlotProps'>) {
  return (
    <section data-slot="landing-tiers" className={SECTION}>
      <Heading size="section" id="tiers">
        {tiersTitle}
      </Heading>
      {/* an ordered climb, so the ladder is an <ol>: the sequence is the section's argument */}
      <ol className="mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-3 p-0 max-sm:grid-cols-2 2xl:grid-cols-7">
        {tiers.map((t) => (
          <FoilCard
            as="li"
            key={t.key}
            data-slot="tier-card"
            rarityLadder
            tierKey={t.key}
            className="flex flex-col rounded-lg material-raised p-3"
          >
            {/* the slot is permanent, so loading, ready and failed all keep the same box */}
            <FoilMedia className="block overflow-hidden">
              <span
                data-slot="tier-frame-slot"
                className="relative block aspect-4/3 min-h-26 w-full"
                {...frameSlotProps[t.key]}
              >
                {frameImageProps[t.key] ? (
                  <img
                    data-slot="tier-frame-img"
                    className="block h-full w-full object-cover"
                    {...frameImageProps[t.key]}
                  />
                ) : null}
              </span>
            </FoilMedia>
            <Heading as="h3" size="card-title-phone" className="mt-3">
              {t.name}
            </Heading>
            <span className="mt-2.5 text-sm font-semibold text-link tabular-nums">
              {t.resharesLabel}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">{t.rarityLabel}</span>
          </FoilCard>
        ))}
      </ol>
    </section>
  )
}
