import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSettingsScreen } from '../hooks/useSettingsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export const SettingsView = observer(function SettingsView() {
  const model = useSettingsScreen()
  useDocumentTitle(model.title)
  return <SettingsScreen {...model} />
})
