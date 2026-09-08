import { observer } from 'mobx-react-lite'
import { useMarketplaceScreen } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from '../screens/MarketplaceScreen'

export const MarketplaceView = observer(function MarketplaceView() {
  return <MarketplaceScreen {...useMarketplaceScreen()} />
})
