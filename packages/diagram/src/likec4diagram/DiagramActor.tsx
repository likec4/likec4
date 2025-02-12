import type { ViewId } from '@likec4/core'
import { useActorRef } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, useEffect } from 'react'
import { DiagramFeatures, useDiagramEventHandlers, useEnabledFeatures, useDiagramEventHandlersRef } from '../context/DiagramEventHandlers'
import { useDiagramActor } from '../hooks/useDiagramActor'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { LikeC4ViewMachineContextProvider } from './state/actorContext'
// import { useInspector } from './state/inspector'
import { useDiagramContext } from '../hooks/useDiagramContext'
import { type Input, diagramMachine } from './state/machine'
import { syncManualLayoutActor } from './state/syncManualLayoutActor'
import type { Types } from './types'

type ActorContextInput = Omit<Input, 'xystore' | 'features'>

export function DiagramActor({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const handlersRef = useDiagramEventHandlersRef()
  const xystore = useStoreApi<Types.Node, Types.Edge>()
  //const inspector = useInspector()

  const actorRef = useActorRef(
    diagramMachine.provide({
      actions: {
        'trigger:NavigateTo': ((_, { viewId }) => {
          handlersRef.current.onNavigateTo?.(viewId as ViewId)
        }),

        'trigger:OnChange': ((_, params) => {
          handlersRef.current.onChange?.(params)
        }),

        'trigger:OpenSource': ((_, params) => {
          handlersRef.current.onOpenSource?.(params)
        }),
      },
      actors: {
        syncManualLayoutActor: syncManualLayoutActor.provide({
          actions: {
            'trigger:OnChange': ((_, params) => {
              handlersRef.current.onChange?.(params)
            }),
          },
        }),
      },
    }),
    {
      id: `diagram:${input.view.id}`,
      ...inspector,
      input: {
        xystore,
        ...input,
      },
      logger(...args: [any, ...any[]]) {
        consola.debug(...args)
      },
    },
  )

  return (
    (
      <LikeC4ViewMachineContextProvider value={actorRef}>
        <SyncStore input={input} />
        <DiagramActorToggledFeatures>
          {children}
        </DiagramActorToggledFeatures>
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

function DiagramActorToggledFeatures({ children }: PropsWithChildren) {
  const toggledFeatures = useDiagramContext(s => s.toggledFeatures)
  return (
    <DiagramFeatures
      overrides={toggledFeatures}>
      {children}
    </DiagramFeatures>
  )
}
