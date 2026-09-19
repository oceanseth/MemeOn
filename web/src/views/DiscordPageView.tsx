import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDiscordPageScreen } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from '../screens/DiscordPageScreen'

export const DiscordPageView = observer(function DiscordPageView() {
  const model = useDiscordPageScreen()
  useDocumentTitle(model.copy.pageTitle)
  return <DiscordPageScreen {...model} />
})
