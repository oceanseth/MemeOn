import { observer } from 'mobx-react-lite'
import { useFriendsScreen } from '../hooks/useFriendsScreen'
import { FriendsScreen } from '../screens/FriendsScreen'

export const FriendsView = observer(function FriendsView() {
  return <FriendsScreen {...useFriendsScreen()} />
})
