import { createSafeContext } from '@mantine/core'
import { type LikeC4ViewActorRef } from './machine'

// export const {
//   Provider: LikeC4ViewMachineContextProvider,
//   useSelector,
//   useActorRef,
// } = createActorContext(diagramMachine)

export const [
  LikeC4ViewMachineContextProvider,
  useActorRef,
] = createSafeContext<LikeC4ViewActorRef>('LikeC4ViewMachineContextProvider must be used inside DiagramActor')
