import type { ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useUpdateEffect } from '@react-hookz/web'
import { createBrowserInspector } from '@statelyai/inspect'
import { createActorContext } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, useEffect } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures } from '../context'
import { type Input, likeC4ViewMachine } from './state/machine'
import type { Types } from './types'

let inspector = createBrowserInspector({
  autoStart: false,
  filter: (event) => {
    return event.type !== '@xstate.event' || event.event.type !== 'xyflow.applyNodeChages'
    // return !event.
  },
})

const LikeC4ViewMachine = createActorContext(likeC4ViewMachine)

export const useActorRef = LikeC4ViewMachine.useActorRef
export const useSelector = LikeC4ViewMachine.useSelector

type ActorContextInput = Omit<Input, 'xystore' | 'features'>

export function DiagramActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const { onNavigateTo, onOpenSource } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()
  return (
    (
      <LikeC4ViewMachine.Provider
        logic={likeC4ViewMachine.provide({
          actions: {
            triggerNavigateTo: useCallbackRef((_, { viewId }) => {
              onNavigateTo?.(viewId as ViewId)
            }),

            triggerOpenSource: useCallbackRef((_, params) => {
              onOpenSource?.(params)
            }),
          },
        })}
        options={{
          inspect: inspector.inspect,
          id: `diagram${input.view.id}`,
          input: {
            xystore,
            ...input,
          },
        }}
      >
        <SyncStore input={input} />
        {children}
      </LikeC4ViewMachine.Provider>
    )
  )
}

const SyncStore = ({ input: { view, xyedges, xynodes, ...inputs } }: { input: ActorContextInput }) => {
  const features = useEnabledFeatures()
  const { send } = LikeC4ViewMachine.useActorRef()
  // console.log('SyncStore', view, inputs)
  useUpdateEffect(() => {
    send({ type: 'update.inputs', inputs })
  }, [send, inputs])

  useEffect(() => {
    send({ type: 'update.features', features })
  }, [send, features])

  useUpdateEffect(() => {
    send({ type: 'update.view', view, xyedges, xynodes })
  }, [send, view, xyedges, xynodes])
  return null
}
