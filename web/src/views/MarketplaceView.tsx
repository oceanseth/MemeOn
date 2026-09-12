import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMarketplaceScreen } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from '../screens/MarketplaceScreen'

export const MarketplaceView = observer(function MarketplaceView() {
  useDocumentTitle('Marketplace')
  return <MarketplaceScreen {...useMarketplaceScreen()} />
})
