import { useLandingScreen } from '../hooks/useLandingScreen'
import { LandingScreen } from '../screens/LandingScreen'

export function LandingView() {
  return <LandingScreen {...useLandingScreen()} />
}
