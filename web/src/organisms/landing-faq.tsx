import { Heading } from '@/atoms/heading'
import { FaqItem } from '@/molecules/faq-item'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

const SECTION = 'mt-14 max-md:mt-10'

/** FAQ list: model rows onto the existing FaqItem molecule. */
export function LandingFaq({ faqTitle, faqItems }: Pick<LandingScreenModel, 'faqTitle' | 'faqItems'>) {
  return (
    <section data-slot="landing-faq" className={SECTION}>
      <Heading size="section" className="mb-6">{faqTitle}</Heading>
      <div className="max-w-[65ch]">
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
