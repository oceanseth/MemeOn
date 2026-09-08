import { observer } from 'mobx-react-lite'
import { useBinderScreen } from '../hooks/useBinderScreen'
import { BinderScreen } from '../screens/BinderScreen'

export const BinderView = observer(function BinderView() {
  return <BinderScreen {...useBinderScreen()} />
})
