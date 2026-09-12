import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PrivacyScreen } from '../screens/PrivacyScreen'

export const PrivacyView = observer(function PrivacyView() {
  useDocumentTitle('Privacy Policy')
  return <PrivacyScreen />
})
