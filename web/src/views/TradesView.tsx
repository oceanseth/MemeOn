import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTradesScreen } from '../hooks/useTradesScreen'
import { TradesScreen } from '../screens/TradesScreen'

export const TradesView = observer(function TradesView() {
  useDocumentTitle('Trade')
  return <TradesScreen {...useTradesScreen()} />
})
