import { observer } from 'mobx-react-lite'
import { useInviteScreen } from '../hooks/useInviteScreen'
import { InviteScreen } from '../screens/InviteScreen'

export const InviteView = observer(function InviteView() {
  return <InviteScreen {...useInviteScreen()} />
})
