import { describe, expect, it } from 'vitest'
import { termsCopy as copy } from '../copy/terms'
import { buildTermsScreenModel } from './termsModel'

describe('terms screen model', () => {
  it('reads every heading and cross-link from termsCopy', () => {
    const model = buildTermsScreenModel()

    expect(model.title).toBe(copy.title)
    expect(model.updated).toEqual(copy.updated)
    expect(model.tocLabel).toBe(copy.tocLabel)
    // the chips are the sections: every anchor lands on a heading that exists
    expect(model.toc).toEqual(model.sections.map((section) => ({ id: section.id, label: section.heading })))
    expect(model.crossLink).toEqual(copy.crossLink)
    expect(model.sections.map((section) => section.heading)).toEqual([
      copy.whatMemeonIs.heading,
      copy.yourAccount.heading,
      copy.yourContent.heading,
      copy.claimsAndTakedowns.heading,
      copy.marketIsAGame.heading,
      copy.thirdPartyServices.heading,
      copy.noWarranty.heading,
      copy.contact.heading,
    ])
  })
})
