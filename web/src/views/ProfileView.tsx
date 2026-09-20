import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfileScreen, type ProfileTab } from '../hooks/useProfileScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export function ProfileView({ initialTab }: { initialTab?: ProfileTab }) {
  const model = useProfileScreen(initialTab === undefined ? {} : { initialTab })
  useDocumentTitle(model.documentTitle)
  return <ProfileScreen {...model} />
}
