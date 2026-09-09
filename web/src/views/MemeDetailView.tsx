import { observer } from 'mobx-react-lite'
import { useMemeDetailScreen } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from '../screens/MemeDetailScreen'
import { useParams } from 'react-router-dom'

const MemeDetailRouteScreen = observer(function MemeDetailRouteScreen() {
  return <MemeDetailScreen {...useMemeDetailScreen()} />
})

export const MemeDetailView = observer(function MemeDetailView() {
  const { id } = useParams<{ id: string }>()
  return <MemeDetailRouteScreen key={id} />
})
