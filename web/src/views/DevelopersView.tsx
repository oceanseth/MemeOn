import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDevelopersScreen } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from '../screens/DevelopersScreen'

export const DevelopersView = observer(function DevelopersView() {
  useDocumentTitle('Developers')
  return <DevelopersScreen {...useDevelopersScreen()} />
})
