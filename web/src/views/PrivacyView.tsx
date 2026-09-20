import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { buildPrivacyScreenModel } from '../lib/privacyModel'
import { PrivacyScreen } from '../screens/PrivacyScreen'

export function PrivacyView() {
  const model = buildPrivacyScreenModel()
  useDocumentTitle(model.title)
  return <PrivacyScreen model={model} />
}
