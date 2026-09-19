import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfileScreen, type ProfileTab } from '../hooks/useProfileScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { PublicBinderScreen } from '../screens/PublicBinderScreen'

export const ProfileView = observer(function ProfileView({
  initialTab,
}: {
  initialTab?: ProfileTab
}) {
  const model = useProfileScreen(initialTab === undefined ? {} : { initialTab })
  useDocumentTitle(model.documentTitle)
  return model.showBinderHero ? <PublicBinderScreen {...model} /> : <ProfileScreen {...model} />
})
