import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDevelopersScreen } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from '../screens/DevelopersScreen'

export function DevelopersView() {
  const model = useDevelopersScreen()
  useDocumentTitle(model.pageTitle)
  return <DevelopersScreen {...model} />
}
