import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMarketplaceScreen } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from '../screens/MarketplaceScreen'

export function MarketplaceView() {
  const model = useMarketplaceScreen()
  useDocumentTitle(model.pageTitle)
  return <MarketplaceScreen {...model} />
}
