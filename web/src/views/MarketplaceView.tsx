import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMarketplaceScreen } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from '../screens/MarketplaceScreen'

export const MarketplaceView = observer(function MarketplaceView() {
  const model = useMarketplaceScreen()
  useDocumentTitle(model.pageTitle)
  return <MarketplaceScreen {...model} />
})
