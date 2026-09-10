import type { OverlaysActorRef } from '../overlays/overlaysActor'
import { selectDiagramSnapshot, useDiagramSelector } from './useDiagram'

const select = selectDiagramSnapshot(
  s => s.children.overlays ?? null,
  Object.is,
)

export function useOverlaysActorRef(): OverlaysActorRef | null {
  return useDiagramSelector(select)
}
