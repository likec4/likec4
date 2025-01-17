import type { ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, useEffect } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures } from '../context'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useDiagramActor } from './hooks'
import { LikeC4ViewMachineContextProvider } from './state/actorContext'
import { useInspector } from './state/inspector'
import { type Input, likeC4ViewMachine } from './state/machine'
import type { Types } from './types'

type ActorContextInput = Omit<Input, 'xystore' | 'features'>

export function DiagramActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const { onNavigateTo, onOpenSource } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()
  const inspector = useInspector()
  return (
    (
      <LikeC4ViewMachineContextProvider
        logic={likeC4ViewMachine.provide({
          actions: {
            'trigger:NavigateTo': useCallbackRef((_, { viewId }) => {
              onNavigateTo?.(viewId as ViewId)
            }),

            'trigger:OpenSource': useCallbackRef((_, params) => {
              onOpenSource?.(params)
            }),
          },
        })}
        options={{
          ...inspector,
          id: `diagram${input.view.id}`,
          input: {
            xystore,
            ...input,
          },
        }}
      >
        <SyncStore input={input} />
        {children}
      </LikeC4ViewMachineContextProvider>
    )
  )
}

const SyncStore = ({ input: { view, xyedges, xynodes, ...inputs } }: { input: ActorContextInput }) => {
  const features = useEnabledFeatures()
  const { send } = useDiagramActor()
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
