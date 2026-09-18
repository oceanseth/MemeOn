import { LegalDocument, type LegalDocumentModel } from '@/molecules/legal-document'

/** Static terms of service. No engine — copy arrives as a built model. */
export function TermsScreen({ model }: { model: LegalDocumentModel }) {
  return <LegalDocument {...model} />
}
