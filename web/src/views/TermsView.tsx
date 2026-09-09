import { observer } from 'mobx-react-lite'
import { useMountEffect } from '../hooks/useMountEffect'
import { TermsScreen } from '../screens/TermsScreen'

export const TermsView = observer(function TermsView() {
  // WCAG 2.4.2: every route shares index.html's marketing <title> until it sets its own.
  useMountEffect(() => {
    const previous = document.title
    document.title = 'Terms of Service — MemeOn'
    return () => {
      document.title = previous
    }
  })
  return <TermsScreen />
})
