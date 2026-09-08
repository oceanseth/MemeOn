import { observer } from 'mobx-react-lite'
import { useDevelopersScreen } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from '../screens/DevelopersScreen'

export const DevelopersView = observer(function DevelopersView() {
  return <DevelopersScreen {...useDevelopersScreen()} />
})
