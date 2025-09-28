import type { DiagramActorSnapshot } from '../likec4diagram/state/types'
import type { OverlaysActorRef } from '../overlays/overlaysActor'
import { useDiagramActorSnapshot } from './useDiagram'

const select = (s: DiagramActorSnapshot) => {
  return s.children.overlays
}

export function useOverlaysActorRef(): OverlaysActorRef {
  return useDiagramActorSnapshot(select, Object.is)!
}
