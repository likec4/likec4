import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import type { ElementDetailsActorRef } from './actor'
import { ElementDetailsActorContext } from './actorContext'
import { ElementDetailsCard } from './ElementDetailsCard'

export type ElementDetailsProps = {
  actorRef: ElementDetailsActorRef
  onClose: () => void
}
export function ElementDetails({
  actorRef,
  onClose,
}: ElementDetailsProps) {
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
    <ElementDetailsActorContext value={actorRef}>
      <ElementDetailsCard
        onClose={onClose}
        {...props} />
    </ElementDetailsActorContext>
  )
}
