import type { ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, useEffect } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures } from '../context'
import { useDiagramActor } from '../hooks/useDiagramActor'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { LikeC4ViewMachineContextProvider } from './state/actorContext'
// import { useInspector } from './state/inspector'
import { type Input, diagramMachine } from './state/machine'
import { syncManualLayoutActor } from './state/syncManualLayoutActor'
import type { Types } from './types'

type ActorContextInput = Omit<Input, 'xystore' | 'features'>

export function DiagramActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const { onNavigateTo, onOpenSource, onChange } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()
  // const inspector = useInspector()
  return (
    (
      <LikeC4ViewMachineContextProvider
        logic={diagramMachine.provide({
          actions: {
            'trigger:NavigateTo': useCallbackRef((_, { viewId }) => {
              onNavigateTo?.(viewId as ViewId)
            }),

            'trigger:OnChange': useCallbackRef((_, params) => {
              onChange?.(params)
            }),

            'trigger:OpenSource': useCallbackRef((_, params) => {
              onOpenSource?.(params)
            }),
          },
          actors: {
            syncManualLayoutActor: syncManualLayoutActor.provide({
              actions: {
                'trigger:OnChange': useCallbackRef((_, params) => {
                  onChange?.(params)
                }),
              },
            }),
          },
        })}
        options={{
          // ...inspector,
          id: `diagram:${input.view.id}`,
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
