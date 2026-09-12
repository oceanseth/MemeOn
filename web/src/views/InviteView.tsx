import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useInviteScreen } from '../hooks/useInviteScreen'
import { InviteScreen } from '../screens/InviteScreen'

export const InviteView = observer(function InviteView() {
  useDocumentTitle("You're invited")
  return <InviteScreen {...useInviteScreen()} />
})
