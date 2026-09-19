import { observer } from 'mobx-react-lite'
import { useAuthCallbackScreen } from '../hooks/useAuthCallbackScreen'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { AuthStatusScreen } from '../screens/AuthStatusScreen'

/** `/auth/callback` — Masky's OAuth redirect lands here. */
export const AuthCallbackView = observer(function AuthCallbackView() {
  const model = useAuthCallbackScreen()
  useDocumentTitle(model.documentTitle)
  return <AuthStatusScreen {...model} />
})
