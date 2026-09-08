import { observer } from 'mobx-react-lite'
import { useTradesScreen } from '../hooks/useTradesScreen'
import { TradesScreen } from '../screens/TradesScreen'

export const TradesView = observer(function TradesView() {
  return <TradesScreen {...useTradesScreen()} />
})
