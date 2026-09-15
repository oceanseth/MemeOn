import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { buildTermsScreenModel } from '../lib/termsModel'
import { TermsScreen } from '../screens/TermsScreen'

export const TermsView = observer(function TermsView() {
  const model = buildTermsScreenModel()
  useDocumentTitle(model.title)
  return <TermsScreen model={model} />
})
