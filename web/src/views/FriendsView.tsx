import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFriendsScreen } from '../hooks/useFriendsScreen'
import { FriendsScreen } from '../screens/FriendsScreen'

export const FriendsView = observer(function FriendsView() {
  useDocumentTitle('Friends')
  return <FriendsScreen {...useFriendsScreen()} />
})
