import { privacyCopy as copy } from '../copy/privacy'
import {
  buildLegalDocumentModel,
  legalCode,
  legalExternalLink,
  legalInAppLink,
  legalList,
  legalListItem,
  legalMailto,
  legalParagraph,
  legalStrong,
  type LegalDocumentModel,
} from './legalDocumentModel'

export type PrivacyScreenModel = LegalDocumentModel

export function buildPrivacyScreenModel(): PrivacyScreenModel {
  const { whatWeCollect, deletion, changes } = copy
  const { discord } = whatWeCollect
  return buildLegalDocumentModel({
    title: copy.title,
    updated: copy.updated,
    tocLabel: copy.tocLabel,
    crossLink: copy.crossLink,
    sections: [
      {
        id: 'short-version',
        heading: copy.shortVersion.heading,
        blocks: [
          legalParagraph(copy.shortVersion.intro),
          legalParagraph(
            copy.shortVersion.maskyLead,
            ' ',
            legalStrong(copy.shortVersion.maskyStrong),
            '.',
          ),
          legalParagraph(copy.shortVersion.noAds),
        ],
      },
      {
        id: 'what-we-collect',
        heading: whatWeCollect.heading,
        blocks: [
          legalList([
            ...whatWeCollect.items.map((item) =>
              legalListItem(item.strong, legalStrong(item.strong), ' ', item.body),
            ),
            legalListItem(
              discord.strong,
              legalStrong(discord.strong),
              ' ',
              discord.lead,
              ' ',
              legalCode(discord.command),
              discord.body,
            ),
          ]),
        ],
      },
      {
        id: 'what-we-never-collect',
        heading: copy.whatWeNeverCollect.heading,
        blocks: [legalParagraph(copy.whatWeNeverCollect.body)],
      },
      {
        id: 'where-it-lives',
        heading: copy.whereItLives.heading,
        blocks: [legalParagraph(copy.whereItLives.body)],
      },
      {
        id: 'deletion',
        heading: deletion.heading,
        blocks: [
          legalParagraph(
            deletion.ownersLead,
            ' ',
            legalInAppLink(deletion.makePrivate.to, deletion.makePrivate.text),
            ' ',
            deletion.privateSuffix,
            ' ',
            legalMailto(deletion.email, deletion.emailSubject, deletion.email),
            ' ',
            deletion.afterEmail,
            legalExternalLink(deletion.maskyDeveloper.href, deletion.maskyDeveloper.text),
            deletion.closing,
          ),
        ],
      },
      {
        id: 'age',
        heading: copy.age.heading,
        blocks: [legalParagraph(copy.age.body)],
      },
      {
        id: 'changes',
        heading: changes.heading,
        blocks: [
          legalParagraph(
            changes.lead,
            ' ',
            legalMailto(changes.email, changes.emailSubject, changes.email),
            '.',
          ),
        ],
      },
    ],
  })
}
