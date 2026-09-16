import type { ComponentPropsWithoutRef } from 'react'

export interface PortalAnchorProps extends Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'id'> {
  /** the id `portalAnchor(id)` (lib/portalAnchor) resolves at portal time */
  id: string
}

/** `display: contents`, so an idle overlay costs its screen no box and no flex gap. */
export function PortalAnchor({ id, ...props }: PortalAnchorProps) {
  return <span {...props} id={id} className="contents" data-slot="portal-anchor" />
}
