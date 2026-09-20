import { describe, expect, it } from 'vitest'
import { privacyCopy as copy } from '../copy/privacy'
import { expectLegalDocumentChrome } from './legalDocumentModel.testSupport'
import { buildPrivacyScreenModel } from './privacyModel'

describe('privacy screen model', () => {
  it('reads every heading and cross-link from privacyCopy', () => {
    const model = buildPrivacyScreenModel()

    expectLegalDocumentChrome(model, copy)
    expect(model.sections.map((section) => section.heading)).toEqual([
      copy.shortVersion.heading,
      copy.whatWeCollect.heading,
      copy.whatWeNeverCollect.heading,
      copy.whereItLives.heading,
      copy.deletion.heading,
      copy.age.heading,
      copy.changes.heading,
    ])
  })
})
