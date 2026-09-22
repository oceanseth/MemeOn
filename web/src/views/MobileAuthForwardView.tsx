import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMobileAuthForwardScreen } from '../hooks/useMobileAuthForwardScreen'
import { AuthStatusScreen } from '../screens/AuthStatusScreen'

/** `/auth/mobile` — the https redirect the native app registers with Masky; forwards into `memeon://`. */
export function MobileAuthForwardView() {
  const model = useMobileAuthForwardScreen()
  useDocumentTitle(model.documentTitle)
  return <AuthStatusScreen {...model} />
}
