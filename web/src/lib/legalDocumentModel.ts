/**
 * Legal prose as data. The Privacy and Terms builders assemble these blocks from `copy/`;
 * `molecules/LegalDocument` is the one place that turns them into elements, so `lib/` stays
 * free of React trees and the tiers keep importing types only.
 */
export type LegalInline =
  | string
  | { kind: 'strong'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; to: string; text: string }
  | { kind: 'external'; href: string; text: string }
  | { kind: 'mailto'; href: string; text: string }

export interface LegalListItem {
  key: string
  inlines: readonly LegalInline[]
}

export type LegalBlock =
  | { kind: 'paragraph'; inlines: readonly LegalInline[] }
  | { kind: 'list'; items: readonly LegalListItem[] }

export interface LegalDocumentSection {
  id: string
  heading: string
  blocks: readonly LegalBlock[]
}

export interface LegalDocumentModel {
  title: string
  updated: { prefix: string; datetime: string; label: string }
  tocLabel: string
  /** one entry per section, in order — derived, so a chip can never point at a missing heading */
  toc: readonly { id: string; label: string }[]
  sections: readonly LegalDocumentSection[]
  crossLink: { to: string; label: string }
}

export const legalParagraph = (...inlines: LegalInline[]): LegalBlock => ({
  kind: 'paragraph',
  inlines,
})

export const legalList = (items: readonly LegalListItem[]): LegalBlock => ({
  kind: 'list',
  items,
})

export const legalListItem = (key: string, ...inlines: LegalInline[]): LegalListItem => ({
  key,
  inlines,
})

export const legalStrong = (text: string): LegalInline => ({
  kind: 'strong',
  text,
})

export const legalCode = (text: string): LegalInline => ({ kind: 'code', text })

export const legalInAppLink = (to: string, text: string): LegalInline => ({
  kind: 'link',
  to,
  text,
})

export const legalExternalLink = (href: string, text: string): LegalInline => ({
  kind: 'external',
  href,
  text,
})

export const legalMailto = (email: string, subject: string, text: string): LegalInline => ({
  kind: 'mailto',
  href: `mailto:${email}?subject=${encodeURIComponent(subject)}`,
  text,
})

/** The table of contents is the section list itself, so the two can never disagree. */
export function buildLegalDocumentModel(
  input: Omit<LegalDocumentModel, 'toc'>,
): LegalDocumentModel {
  return {
    ...input,
    toc: input.sections.map((section) => ({
      id: section.id,
      label: section.heading,
    })),
  }
}
