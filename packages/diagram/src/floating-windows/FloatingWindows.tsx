import { useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import {
  AnimatePresence,
} from 'motion/react'
import { PortalToContainer } from '../custom'
import type { FloatingWindowsActorRef } from './actor/actor'
import type { WindowId } from './actor/types'
import { ViewDetailsWindow } from './ViewDetailsWindow'

type FloatingWindowsProps = {
  actor: FloatingWindowsActorRef
}

export function FloatingWindows({ actor }: FloatingWindowsProps) {
  const openedWindows = useSelector(actor, (snapshot) => [...snapshot.context.opened], deepEqual)

  const renderedWindow = (id: WindowId) => {
    switch (id) {
      case 'view-details':
        return <ViewDetailsWindow key={id} id="view-details" actorRef={actor} />
      default:
        return null
    }
  }

  return (
    <PortalToContainer>
      <AnimatePresence propagate mode="popLayout">
        {openedWindows.map(renderedWindow)}
      </AnimatePresence>
    </PortalToContainer>
  )
}
