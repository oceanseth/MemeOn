import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { buildTermsScreenModel } from '../lib/termsModel'
import { TermsScreen } from '../screens/TermsScreen'

export function TermsView() {
  const model = buildTermsScreenModel()
  useDocumentTitle(model.title)
  return <TermsScreen model={model} />
}
