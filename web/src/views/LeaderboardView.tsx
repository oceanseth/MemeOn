import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLeaderboardScreen } from '../hooks/useLeaderboardScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'

export const LeaderboardView = observer(function LeaderboardView() {
  useDocumentTitle('🏆 Top Brains')
  return <LeaderboardScreen {...useLeaderboardScreen()} />
})
