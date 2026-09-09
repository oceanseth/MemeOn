import { observer } from 'mobx-react-lite'
import { useLeaderboardScreen } from '../hooks/useLeaderboardScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'

export const LeaderboardView = observer(function LeaderboardView() {
  return <LeaderboardScreen {...useLeaderboardScreen()} />
})
