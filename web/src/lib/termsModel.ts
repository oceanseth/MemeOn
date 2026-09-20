import { termsCopy as copy } from '../copy/terms'
import {
  buildLegalDocumentModel,
  legalExternalLink,
  legalInAppLink,
  legalMailto,
  legalParagraph,
  legalStrong,
  type LegalDocumentModel,
} from './legalDocumentModel'

export type TermsScreenModel = LegalDocumentModel

export function buildTermsScreenModel(): TermsScreenModel {
  const { claimsAndTakedowns, thirdPartyServices } = copy
  return buildLegalDocumentModel({
    title: copy.title,
    updated: copy.updated,
    tocLabel: copy.tocLabel,
    crossLink: copy.crossLink,
    sections: [
      {
        id: 'what-memeon-is',
        heading: copy.whatMemeonIs.heading,
        blocks: [
          legalParagraph(copy.whatMemeonIs.intro),
          legalParagraph(legalStrong(copy.whatMemeonIs.currencyStrong)),
          legalParagraph(copy.whatMemeonIs.disclaimer),
        ],
      },
      {
        id: 'your-account',
        heading: copy.yourAccount.heading,
        blocks: [legalParagraph(copy.yourAccount.body)],
      },
      {
        id: 'your-content',
        heading: copy.yourContent.heading,
        blocks: [
          legalParagraph(
            copy.yourContent.bodyBeforeLink,
            ' ',
            legalExternalLink(copy.yourContent.maskyTerms.href, copy.yourContent.maskyTerms.text),
            copy.yourContent.bodyAfterLink,
          ),
        ],
      },
      {
        id: 'claims-and-takedowns',
        heading: claimsAndTakedowns.heading,
        blocks: [
          legalParagraph(
            claimsAndTakedowns.lead,
            ' ',
            legalInAppLink(claimsAndTakedowns.claimFlow.to, claimsAndTakedowns.claimFlow.text),
            '. ',
            claimsAndTakedowns.mid,
            ' ',
            legalMailto(
              claimsAndTakedowns.email,
              claimsAndTakedowns.emailSubject,
              claimsAndTakedowns.email,
            ),
            ' ',
            claimsAndTakedowns.tail,
          ),
        ],
      },
      {
        id: 'the-market-is-a-game',
        heading: copy.marketIsAGame.heading,
        blocks: [
          legalParagraph(copy.marketIsAGame.intro),
          legalParagraph(legalStrong(copy.marketIsAGame.tradesStrong)),
          legalParagraph(copy.marketIsAGame.reshare),
        ],
      },
      {
        id: 'third-party-services',
        heading: thirdPartyServices.heading,
        blocks: [
          legalParagraph(
            thirdPartyServices.signInLead,
            ' ',
            legalExternalLink(
              thirdPartyServices.maskyTerms.href,
              thirdPartyServices.maskyTerms.text,
            ),
            thirdPartyServices.signInTail,
            ' ',
            legalExternalLink(
              thirdPartyServices.discordTerms.href,
              thirdPartyServices.discordTerms.text,
            ),
            thirdPartyServices.giphyLead,
            ' ',
            legalExternalLink(thirdPartyServices.giphy.href, thirdPartyServices.giphy.text),
            ' ',
            thirdPartyServices.giphyTail,
          ),
        ],
      },
      {
        id: 'no-warranty',
        heading: copy.noWarranty.heading,
        blocks: [legalParagraph(copy.noWarranty.body)],
      },
      {
        id: 'contact',
        heading: copy.contact.heading,
        blocks: [
          legalParagraph(
            legalMailto(copy.contact.email, copy.contact.emailSubject, copy.contact.email),
          ),
        ],
      },
    ],
  })
}
