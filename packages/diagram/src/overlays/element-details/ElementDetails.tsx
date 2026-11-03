import type { Fqn } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import { MarkdownRefsProvider } from '../../context/MarkdownRefsContext'
import { useDiagram } from '../../hooks/useDiagram'
import { useDiagramMarkdownRefActions } from '../../hooks/useDiagramMarkdownRefActions'
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
  subject: s.context.subject,
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
  const diagram = useDiagram()
  // Element refs in Markdown replace the content of this card, instead of opening another one
  const replaceSubject = useCallback((fqn: Fqn) => {
    diagram.overlays().send({
      type: 'change.elementDetails',
      actorId: actorRef.id,
      subject: { type: 'element', element: fqn },
    })
  }, [diagram, actorRef])
  const refActions = useDiagramMarkdownRefActions({ openElement: replaceSubject })
  return (
    <ElementDetailsActorContext.Provider value={actorRef}>
      <MarkdownRefsProvider value={refActions}>
        <ElementDetailsCard
          onClose={onClose}
          {...props} />
      </MarkdownRefsProvider>
    </ElementDetailsActorContext.Provider>
  )
}
