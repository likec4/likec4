import { useActorRef } from '../state/actorContext'
import type { LikeC4ViewActorRef } from '../state/machine'

export function useDiagramActor(): LikeC4ViewActorRef {
  return useActorRef()
}
