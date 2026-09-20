import { describe, expect, it } from 'vitest'
import { termsCopy as copy } from '../copy/terms'
import { expectLegalDocumentChrome } from './legalDocumentModel.testSupport'
import { buildTermsScreenModel } from './termsModel'

describe('terms screen model', () => {
  it('reads every heading and cross-link from termsCopy', () => {
    const model = buildTermsScreenModel()

    expectLegalDocumentChrome(model, copy)
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
