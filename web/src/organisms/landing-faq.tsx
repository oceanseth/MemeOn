import { Heading } from '@/atoms/heading'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { FaqItem } from '@/molecules/faq-item'

const SECTION = 'mt-14 max-md:mt-10'

export type LandingFaqProps = Pick<LandingScreenModel, 'faqTitle' | 'faqItems'>

/** FAQ list: maps model rows onto FaqItem. Does not reimplement collapsible. */
export function LandingFaq({ faqTitle, faqItems }: LandingFaqProps) {
  return (
    <section data-slot="landing-faq" className={SECTION}>
      <Heading size="section" className="mb-6">
        {faqTitle}
      </Heading>
      <div className="max-w-prose">
        {faqItems.map((item) => (
          <FaqItem key={item.id} question={item.question} defaultOpen={item.defaultOpen}>
            {item.imageSrc ? (
              <img
                src={item.imageSrc}
                alt={item.imageAlt}
                className="mt-1.5 mb-1.5 ml-3 size-18 float-right rounded-full object-cover align-middle"
              />
            ) : null}
            <p>{item.body}</p>
          </FaqItem>
        ))}
      </div>
    </section>
  )
}
