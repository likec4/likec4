import type { SearchActorRef } from '../search/searchActor'
import { selectDiagramSnapshot, useDiagramSelector } from './useDiagram'

const select = selectDiagramSnapshot(
  s => s.children.search ?? null,
  Object.is,
)

export function useSearchActorRef(): SearchActorRef | null {
  return useDiagramSelector(select)
}
