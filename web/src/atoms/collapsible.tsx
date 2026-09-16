import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

/**
 * Base UI's Collapsible with the registry's part names; the paint belongs to the composition
 * (FaqItem wears the raised card). Base UI marks state with `data-open`/`data-closed` on every
 * part and `data-panel-open` on the trigger, so a caret can turn with `group-data-panel-open:`.
 */
export function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

export function CollapsibleTrigger(props: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

export function CollapsibleContent(props: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
}
