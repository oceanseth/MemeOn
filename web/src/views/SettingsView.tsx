import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSettingsScreen } from '../hooks/useSettingsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export const SettingsView = observer(function SettingsView() {
  useDocumentTitle('Settings')
  return <SettingsScreen {...useSettingsScreen()} />
})
