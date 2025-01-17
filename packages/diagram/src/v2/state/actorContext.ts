import { createActorContext } from '@xstate/react'
import { likeC4ViewMachine } from './machine'

export const {
  Provider: LikeC4ViewMachineContextProvider,
  useSelector,
  useActorRef,
} = createActorContext(likeC4ViewMachine)
