import type { OverlaysActorRef } from '../overlays/overlaysActor'
import { selectDiagramActor, useDiagramSnapshot } from './useDiagram'

const select = selectDiagramActor(s => {
  return s.children.overlays
})

export function useOverlaysActorRef(): OverlaysActorRef {
  return useDiagramSnapshot(select, Object.is)!
}
