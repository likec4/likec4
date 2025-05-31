import type { SearchActorRef } from '../search/searchActor'
import type { DiagramActorSnapshot } from '../state/types'
import { useDiagramActorSnapshot } from './useDiagram'

const select = (s: DiagramActorSnapshot) => {
  return s.children.search ?? null
}

export function useSearchActorRef(): SearchActorRef | null {
  return useDiagramActorSnapshot(select, Object.is)
}
