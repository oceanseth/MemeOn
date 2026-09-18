import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDiscordLinkScreen } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from '../screens/DiscordLinkScreen'

export const DiscordLinkView = observer(function DiscordLinkView() {
  useDocumentTitle('Connect Discord')
  return <DiscordLinkScreen {...useDiscordLinkScreen()} />
})
