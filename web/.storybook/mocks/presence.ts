import { getActiveScenario } from '../connected-scenario'

export function startPresence(uid: string): () => void {
  const scenario = getActiveScenario()
  scenario.presenceSubscriptions.push(uid)
  return () => {}
}

export function watchPresence(callback: (online: Set<string>) => void): () => void {
  const scenario = getActiveScenario()
  scenario.presenceSubscriptions.push(scenario.id)
  callback(new Set(scenario.online))
  return () => {}
}
