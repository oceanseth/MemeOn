import { Heading } from '@/atoms/heading'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

const SECTION = 'mt-14 max-md:mt-10'
const CARD = 'rounded-lg material-card p-4.5'

export type LandingHowProps = Pick<LandingScreenModel, 'howTitle' | 'howSteps'>

/** How-it-works: three numbered steps from the landing model. */
export function LandingHow({ howTitle, howSteps }: LandingHowProps) {
  return (
    <section data-slot="landing-how" className={SECTION}>
      <Heading size="section">{howTitle}</Heading>
      <ol className="mt-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {howSteps.map((step) => (
          <li key={step.step} className={CARD}>
            {/* step number in link colour — focus token misses contrast on dark surfaces */}
            <span className="block text-sm font-semibold text-link">{step.step}</span>
            <Heading as="h3" size="card-title" className="mt-3">
              {step.title}
            </Heading>
            <p className="mt-2 mb-0 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
