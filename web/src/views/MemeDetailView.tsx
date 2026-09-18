import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMemeDetailScreen } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from '../screens/MemeDetailScreen'
import { useParams } from 'react-router-dom'

const MemeDetailRouteScreen = observer(function MemeDetailRouteScreen() {
  return <MemeDetailScreen {...useMemeDetailScreen()} />
})

export const MemeDetailView = observer(function MemeDetailView() {
  /* the route's name, not the record's: the card's own title arrives after the fetch, and a title
     that changes once the page is already announced is a page announced twice */
  useDocumentTitle('Meme')
  const { id } = useParams<{ id: string }>()
  return <MemeDetailRouteScreen key={id} />
})
