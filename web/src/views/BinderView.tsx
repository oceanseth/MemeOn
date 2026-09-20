import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useBinderScreen } from '../hooks/useBinderScreen'
import { BinderScreen } from '../screens/BinderScreen'

export function BinderView() {
  const model = useBinderScreen()
  useDocumentTitle(model.pageTitle)
  return <BinderScreen {...model} />
}
