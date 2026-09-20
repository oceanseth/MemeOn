import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useInviteScreen } from '../hooks/useInviteScreen'
import { InviteScreen } from '../screens/InviteScreen'

export function InviteView() {
  const model = useInviteScreen()
  useDocumentTitle(model.pageTitle)
  return <InviteScreen {...model} />
}
