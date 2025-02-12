import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useOverlays } from '../../hooks/useOverlays'
import type { ElementDetailsActorRef } from './actor'
import { ElementDetailsCard } from './ElementDetailsCard'

export type ElementDetailsProps = {
  actorRef: ElementDetailsActorRef
}
export function ElementDetails({
  actorRef,
}: ElementDetailsProps) {
  const overlay = useOverlays()
  const props = useSelector(
    actorRef,
    useCallbackRef((s) => ({
      viewId: s.context.currentView.id,
      fromNode: s.context.initiatedFrom.node,
      rectFromNode: s.context.initiatedFrom.clientRect,
      fqn: s.context.subject,
    })),
    shallowEqual,
  )
  return (
    <ElementDetailsCard
      onClose={() => {
        overlay.close(actorRef)
      }}
      {...props} />
  )
}
