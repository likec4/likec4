import type { ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useResizeObserver } from '@react-hookz/web'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, useEffect } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures, useRootContainer, useRootContainerRef } from '../context'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useDiagramActor } from '../hooks2'
import { LikeC4ViewMachineContextProvider } from './state/actorContext'
import { useInspector } from './state/inspector'
import { type Input, diagramMachine } from './state/machine'
import { syncManualLayoutActor } from './state/syncManualLayoutActor'
import type { Types } from './types'

type ActorContextInput = Omit<Input, 'xystore' | 'features'>

export function DiagramActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const { onNavigateTo, onOpenSource, onChange } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()
  const inspector = useInspector()
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
          ...inspector,
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
  const rootContainer = useRootContainerRef()
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

  if (features.enableFitView) {
    return <FitOnResize onResize={() => send({ type: 'xyflow.resized' })} />
  }
  return null
}

const FitOnResize = ({ onResize }: { onResize: (entry: ResizeObserverEntry) => void }) => {
  const rootContainer = useRootContainer()
  useResizeObserver(rootContainer, onResize)
  return null
}
