import { LegalDocument, type LegalDocumentModel } from '../molecules/LegalDocument'

/** Static privacy policy. No engine — copy arrives as a built model. */
export function PrivacyScreen({ model }: { model: LegalDocumentModel }) {
  return <LegalDocument {...model} />
}
