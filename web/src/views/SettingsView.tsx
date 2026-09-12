import { observer } from 'mobx-react-lite'
import { useSettingsScreen } from '../hooks/useSettingsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export const SettingsView = observer(function SettingsView() {
  return <SettingsScreen {...useSettingsScreen()} />
})
