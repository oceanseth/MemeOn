import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { TermsScreen } from '../screens/TermsScreen'

export const TermsView = observer(function TermsView() {
  useDocumentTitle('Terms of Service')
  return <TermsScreen />
})
