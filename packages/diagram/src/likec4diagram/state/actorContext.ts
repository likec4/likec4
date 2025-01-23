import { createActorContext } from '@xstate/react'
import { diagramMachine } from './machine'

export const {
  Provider: LikeC4ViewMachineContextProvider,
  useSelector,
  useActorRef,
} = createActorContext(diagramMachine)
