import { useSelector } from '@xstate/react'
import { snapPosition } from '@xyflow/system'
import { shallowEqual } from 'fast-equals'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import type { ElementDetailsActorRef, ElementDetailsSnapshot } from './actor'
import { ElementDetailsActorContext } from './actorContext'
import { ElementDetailsCard } from './ElementDetailsCard'

export type ElementDetailsProps = {
  actorRef: ElementDetailsActorRef
  onClose: () => void
}

const selector = (s: ElementDetailsSnapshot) => ({
  viewId: s.context.currentView.id,
  fromNode: s.context.initiatedFrom.node,
  rectFromNode: s.context.initiatedFrom.clientRect,
  fqn: s.context.subject,
})

export function ElementDetails({
  actorRef,
  onClose,
}: ElementDetailsProps) {
  const props = useSelector(
    actorRef,
    selector,
    shallowEqual,
  )
  return (
    <ElementDetailsActorContext.Provider value={actorRef}>
      <ElementDetailsCard
        onClose={onClose}
        {...props} />
    </ElementDetailsActorContext.Provider>
  )
}
