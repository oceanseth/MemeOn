import { observer } from 'mobx-react-lite'
import { useDiscordLinkScreen } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from '../screens/DiscordLinkScreen'

export const DiscordLinkView = observer(function DiscordLinkView() {
  return <DiscordLinkScreen {...useDiscordLinkScreen()} />
})
