import { observer } from 'mobx-react-lite'
import { useDiscordPageScreen } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from '../screens/DiscordPageScreen'

export const DiscordPageView = observer(function DiscordPageView() {
  return <DiscordPageScreen {...useDiscordPageScreen()} />
})
