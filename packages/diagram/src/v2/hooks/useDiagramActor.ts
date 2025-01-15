import { LikeC4ViewMachineContext } from '../state/machine'

export function useDiagramActor() {
  return LikeC4ViewMachineContext.useActorRef()
}
