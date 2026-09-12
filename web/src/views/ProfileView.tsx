import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfileScreen, type ProfileTab } from '../hooks/useProfileScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export const ProfileView = observer(function ProfileView({
  initialTab,
}: {
  initialTab?: ProfileTab
}) {
  useDocumentTitle('Profile')
  return <ProfileScreen {...useProfileScreen({ initialTab })} />
})
