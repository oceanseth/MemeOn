import { getActiveScenario } from '../connected-scenario'

export function navigateToAuthorization(url: string): void {
  getActiveScenario().authorizationNavigations.push(url)
}
