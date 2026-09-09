import { observer } from 'mobx-react-lite'
import { useMountEffect } from '../hooks/useMountEffect'
import { PrivacyScreen } from '../screens/PrivacyScreen'

export const PrivacyView = observer(function PrivacyView() {
  // WCAG 2.4.2: every route shares index.html's marketing <title> until it sets its own.
  useMountEffect(() => {
    const previous = document.title
    document.title = 'Privacy Policy — MemeOn'
    return () => {
      document.title = previous
    }
  })
  return <PrivacyScreen />
})
