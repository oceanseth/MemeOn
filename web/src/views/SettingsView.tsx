import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSettingsScreen } from '../hooks/useSettingsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export function SettingsView() {
  const model = useSettingsScreen()
  useDocumentTitle(model.title)
  return <SettingsScreen {...model} />
}
