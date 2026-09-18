import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDiscordPageScreen } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from '../screens/DiscordPageScreen'

export const DiscordPageView = observer(function DiscordPageView() {
  useDocumentTitle('MemeOn for Discord')
  return <DiscordPageScreen {...useDiscordPageScreen()} />
})
