import type { DiagramActorSnapshot } from '../likec4diagram/state/types'
import type { SearchActorRef } from '../search/searchActor'
import { useDiagramActorSnapshot } from './useDiagram'

const select = (s: DiagramActorSnapshot) => {
  return s.children.search ?? null
}

export function useSearchActorRef(): SearchActorRef | null {
  return useDiagramActorSnapshot(select, Object.is)
}
