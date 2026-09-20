import { act } from 'react'
import { settle } from './runtime'

export function button(
  label: string,
  root: ParentNode,
  occurrence: 'first' | 'last' = 'first',
): HTMLButtonElement {
  const matches = [...root.querySelectorAll<HTMLButtonElement>('button')].filter((candidate) =>
    candidate.textContent?.includes(label),
  )
  const found = occurrence === 'first' ? matches[0] : matches.at(-1)
  if (!found) throw new Error(`Missing button: ${label}`)
  return found
}

export async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
    await settle()
  })
}

export function setControlValue(
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value')
  descriptor?.set?.call(control, value)
  control.dispatchEvent(new Event('input', { bubbles: true }))
}

export async function change(
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  await act(async () => {
    setControlValue(control, value)
    await settle()
  })
}
