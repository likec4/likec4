import { useActorRef } from '../likec4diagram/state/actorContext'
import type { LikeC4ViewActorRef } from '../likec4diagram/state/machine'

export function useDiagramActor(): LikeC4ViewActorRef {
  return useActorRef()
}
