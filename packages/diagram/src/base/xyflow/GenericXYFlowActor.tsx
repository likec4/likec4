import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren } from 'react'
import { useInspector } from '../../v2/state/inspector'
import { type Base } from '../types'
import { type Input, GenericXYFlowMachineContext } from './machine'

type ActorContextInput = Omit<Input, 'xystore'>

export function GenericXYFlowActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const xystore = useStoreApi<Base.Node, Base.Edge>()
  const inspector = useInspector()
  return (
    (
      <GenericXYFlowMachineContext.Provider
        options={{
          ...inspector,
          input: {
            xystore,
            ...input,
          },
        }}
      >
        {children}
      </GenericXYFlowMachineContext.Provider>
    )
  )
}

// const SyncStore = ({ input: { view, xyedges, xynodes, ...inputs } }: { input: ActorContextInput }) => {
//   const features = useEnabledFeatures()
//   const { send } = LikeC4ViewMachineContext.useActorRef()
//   useUpdateEffect(() => {
//     send({ type: 'update.inputs', inputs })
//   }, [send, inputs])

//   useEffect(() => {
//     send({ type: 'update.features', features })
//   }, [send, features])

//   useUpdateEffect(() => {
//     send({ type: 'update.view', view, xyedges, xynodes })
//   }, [send, view, xyedges, xynodes])
//   return null
// }
