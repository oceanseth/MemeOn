import { observer } from 'mobx-react-lite'
import { useLandingScreen } from '../hooks/useLandingScreen'
import { LandingScreen } from '../screens/LandingScreen'

export const LandingView = observer(function LandingView() {
  return <LandingScreen {...useLandingScreen()} />
})
