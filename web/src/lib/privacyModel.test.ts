import { describe, expect, it } from 'vitest'
import { privacyCopy as copy } from '../copy/privacy'
import { buildPrivacyScreenModel } from './privacyModel'

describe('privacy screen model', () => {
  it('reads every heading and cross-link from privacyCopy', () => {
    const model = buildPrivacyScreenModel()

    expect(model.title).toBe(copy.title)
    expect(model.updated).toEqual(copy.updated)
    expect(model.tocLabel).toBe(copy.tocLabel)
    // the chips are the sections: every anchor lands on a heading that exists
    expect(model.toc).toEqual(model.sections.map((section) => ({ id: section.id, label: section.heading })))
    expect(model.crossLink).toEqual(copy.crossLink)
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
