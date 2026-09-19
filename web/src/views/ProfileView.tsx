import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfileScreen, profileDocumentTitle, type ProfileTab } from '../hooks/useProfileScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export const ProfileView = observer(function ProfileView({
  initialTab,
}: {
  initialTab?: ProfileTab
}) {
  useDocumentTitle(profileDocumentTitle)
  return <ProfileScreen {...useProfileScreen(initialTab === undefined ? {} : { initialTab })} />
})
