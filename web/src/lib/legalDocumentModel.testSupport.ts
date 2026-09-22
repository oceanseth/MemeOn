import { expect } from 'vitest'
import type { LegalDocumentModel } from './legalDocumentModel'

export function expectLegalDocumentChrome(
  model: LegalDocumentModel,
  copy: {
    title: string
    updated: LegalDocumentModel['updated']
    tocLabel: string
    crossLink: LegalDocumentModel['crossLink']
  },
): void {
  expect(model.title).toBe(copy.title)
  expect(model.updated).toEqual(copy.updated)
  expect(model.tocLabel).toBe(copy.tocLabel)
  expect(model.toc).toEqual(
    model.sections.map((section) => ({
      id: section.id,
      label: section.heading,
    })),
  )
  expect(model.crossLink).toEqual(copy.crossLink)
}
