import { observer } from 'mobx-react-lite'
import { useMemeDetailScreen } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from '../screens/MemeDetailScreen'

export const MemeDetailView = observer(function MemeDetailView() {
  return <MemeDetailScreen {...useMemeDetailScreen()} />
})
