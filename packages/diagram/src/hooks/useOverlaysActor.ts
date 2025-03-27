import type { OverlaysActorRef } from '../overlays/overlaysActor'
import type { DiagramActorSnapshot } from '../state/types'
import { useDiagramActorSnapshot } from './useDiagram'

const select = (s: DiagramActorSnapshot) => {
  return s.children.overlays
}

export function useOverlaysActorRef(): OverlaysActorRef {
  return useDiagramActorSnapshot(select, Object.is)!
}
