import { observer } from 'mobx-react-lite'
import { useProfileScreen, type ProfileTab } from '../hooks/useProfileScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export const ProfileView = observer(function ProfileView({
  initialTab,
}: {
  initialTab?: ProfileTab
}) {
  return <ProfileScreen {...useProfileScreen({ initialTab })} />
})
