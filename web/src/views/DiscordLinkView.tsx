import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDiscordLinkScreen } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from '../screens/DiscordLinkScreen'

export function DiscordLinkView() {
  const model = useDiscordLinkScreen()
  useDocumentTitle(model.documentTitle)
  return <DiscordLinkScreen {...model} />
}
