import type { Loader, StoryContext } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { createConnectedScenario, setActiveScenario, type ConnectedScenarioOptions } from './connected-scenario'
import { StoresProvider } from '../src/stores/StoresContext'

export const connectedLoader = (options: ConnectedScenarioOptions = {}): Loader =>
  ({ id }: StoryContext) => ({ scenario: createConnectedScenario(id, options) })

export async function connectedBeforeEach({ loaded }: StoryContext): Promise<() => void> {
  const scenario = loaded.scenario as ReturnType<typeof createConnectedScenario>
  setActiveScenario(scenario)
  await scenario.start()
  return () => {
    setActiveScenario(null)
    scenario.dispose()
  }
}

export function ConnectedStory({ scenario, children }: { scenario: ReturnType<typeof createConnectedScenario>; children: ReactNode }) {
  return <StoresProvider stores={scenario.stores}>{children}</StoresProvider>
}

export function RemountStory({ children }: { children: (key: number) => ReactNode }) {
  const [mountKey, setMountKey] = useState(0)
  return <>
    <button type="button" onClick={() => setMountKey((key) => key + 1)}>Remount connected view</button>
    {children(mountKey)}
  </>
}
