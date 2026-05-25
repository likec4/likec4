import { styled } from '@likec4/styles/jsx'
import { idBadge } from '@likec4/styles/recipes'
import { ViewDetailsCard } from '../components/ view-details/ViewDetailsCard'
import { useDiagramSelector } from '../hooks/useDiagram'
import type { FloatingWindowsActorRef } from './actor/actor'
import { FloatingWindow } from './FloatingWindow'
import { useFloatingWindow } from './hooks'

export function ViewDetailsWindow({ id, actorRef }: { id: 'view-details'; actorRef: FloatingWindowsActorRef }) {
  const windowProps = useFloatingWindow({ id, actorRef })
  const viewId = useDiagramSelector(({ context }) => context.view.id)
  return (
    <FloatingWindow {...windowProps} header={<ViewIdBadge>{viewId}</ViewIdBadge>}>
      <ViewDetailsCard />
    </FloatingWindow>
  )
}

const ViewIdBadge = styled('div', idBadge)
