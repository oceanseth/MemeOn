import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFriendsScreen } from '../hooks/useFriendsScreen'
import { FriendsScreen } from '../screens/FriendsScreen'

export function FriendsView() {
  const model = useFriendsScreen()
  useDocumentTitle(model.pageTitle)
  return <FriendsScreen {...model} />
}
