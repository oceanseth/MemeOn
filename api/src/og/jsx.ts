/**
 * The JSX runtime satori needs, in one file. Satori takes React-*shaped* nodes —
 * `{ type, props }` — and never calls a hook, a renderer or `react-dom`, so the cards
 * are written as JSX without React in the lambda bundle. `tsconfig` points
 * `jsxFactory`/`jsxFragmentFactory` here; every `.tsx` under `og/` imports both.
 */
import type * as CSS from 'csstype'

/**
 * The style object satori reads. It implements a subset of CSS — flexbox, the box model, type,
 * gradients, `filter: blur()`, `transform` — and silently ignores the rest, so `csstype` is here
 * to catch a misspelt property, not to promise every one of them paints.
 */
export type OgStyle = CSS.Properties<string | number>

export interface OgElement {
  type: string
  props: Record<string, unknown>
}

export type OgNode = OgElement | string | number | null | undefined | false
type Child = OgNode | OgNode[]

/** A card written as a function component: props in, node out. */
export type OgComponent<P = Record<string, unknown>> = (props: P) => OgNode

/** Satori reads `display: flex` (or `contents`/`none`) on every node with >1 child. */
const CONTENTS = { display: 'contents' } as const

export function h(
  type: string | OgComponent<never>,
  props: Record<string, unknown> | null,
  ...children: Child[]
): OgNode {
  const kids = children
    .flat(Infinity as 1)
    .filter((child): child is Exclude<OgNode, null | undefined | false> => {
      return child !== null && child !== undefined && child !== false && child !== ''
    })
  const resolved = { ...props, ...(kids.length ? { children: kids.length === 1 ? kids[0] : kids } : {}) }
  if (typeof type === 'function') return (type as OgComponent<Record<string, unknown>>)(resolved)
  return { type, props: resolved }
}

/** `<>…</>` — a layout-free wrapper, since satori has no fragment node of its own. */
export function Fragment(props: Record<string, unknown>): OgNode {
  return { type: 'div', props: { ...props, style: CONTENTS } }
}

/**
 * The element vocabulary. Satori draws boxes and pictures and nothing else — no `<p>`, no `<span>`,
 * no semantics — so this is the whole list, and `JSX.Element` is a satori node rather than React's.
 */
declare global {
  namespace JSX {
    type Element = OgNode
    interface ElementChildrenAttribute {
      children: unknown
    }
    interface IntrinsicElements {
      div: { style?: OgStyle; children?: unknown }
      img: { src: string; style?: OgStyle }
      svg: { style?: OgStyle; children?: unknown; width?: number; height?: number; viewBox?: string }
    }
  }
}
