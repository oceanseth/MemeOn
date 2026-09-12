import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMobileAuthForwardScreen } from '../hooks/useMobileAuthForwardScreen'
import { AuthStatusScreen } from '../screens/AuthStatusScreen'

/** `/auth/mobile` — the https redirect the native app registers with Masky; forwards into `memeon://`. */
export const MobileAuthForwardView = observer(function MobileAuthForwardView() {
  useDocumentTitle('Returning to the app')
  return <AuthStatusScreen {...useMobileAuthForwardScreen()} />
})
