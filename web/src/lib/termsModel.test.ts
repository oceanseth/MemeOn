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

  it('points both Masky terms links at the user agreement', () => {
    const agreement = 'https://masky.ai/user-agreement'
    expect(copy.yourContent.maskyTerms.href).toBe(agreement)
    expect(copy.thirdPartyServices.maskyTerms.href).toBe(agreement)
    expect(copy.thirdPartyServices.discordTerms.href).toBe('https://discord.com/terms')
    expect(copy.thirdPartyServices.giphy.href).toBe('https://giphy.com')

    const model = buildTermsScreenModel()
    const externals = model.sections.flatMap((section) =>
      section.blocks.flatMap((block) =>
        block.kind === 'paragraph'
          ? block.inlines.flatMap((inline) =>
              typeof inline !== 'string' && inline.kind === 'external'
                ? [{ text: inline.text, href: inline.href }]
                : [],
            )
          : [],
      ),
    )
    const byText = (text: string) => externals.filter((link) => link.text === text)
    expect(byText(copy.yourContent.maskyTerms.text)).toEqual([
      { text: copy.yourContent.maskyTerms.text, href: agreement },
    ])
    expect(byText(copy.thirdPartyServices.maskyTerms.text)).toEqual([
      { text: copy.thirdPartyServices.maskyTerms.text, href: agreement },
    ])
  })
})
