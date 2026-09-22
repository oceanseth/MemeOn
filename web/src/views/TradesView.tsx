import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTradesScreen } from '../hooks/useTradesScreen'
import { TradesScreen } from '../screens/TradesScreen'

export function TradesView() {
  const model = useTradesScreen()
  useDocumentTitle(model.pageTitle)
  return <TradesScreen {...model} />
}
