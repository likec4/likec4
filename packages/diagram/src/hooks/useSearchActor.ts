import type { SearchActorRef } from '../search/searchActor'
import { selectDiagramActor, useDiagramSnapshot } from './useDiagram'

const select = selectDiagramActor(s => {
  return s.children.search ?? null
})

export function useSearchActorRef(): SearchActorRef | null {
  return useDiagramSnapshot(select, Object.is)
}
