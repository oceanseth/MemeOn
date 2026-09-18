import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useBinderScreen } from '../hooks/useBinderScreen'
import { BinderScreen } from '../screens/BinderScreen'

export const BinderView = observer(function BinderView() {
  useDocumentTitle('My Binder')
  return <BinderScreen {...useBinderScreen()} />
})
