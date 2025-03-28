import type { ViewId, WhereOperator } from '@likec4/core'
import { useDeepCompareEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { useDiagramEventHandlersRef } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { DiagramActorSafeContext } from '../hooks/safeContext'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import type { Types } from '../likec4diagram/types'
import { useViewToNodesEdges } from '../likec4diagram/useViewToNodesEdges'
import { type Input, diagramMachine } from './diagram-machine'
import { inspector } from './inspector'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorRef, DiagramActorSnapshot } from './types'

const selectToggledFeatures = (state: DiagramActorSnapshot) => state.context.toggledFeatures
type ActorContextInput = Omit<Input, 'xystore' | 'xynodes' | 'xyedges'>
export function DiagramActorProvider({
  input: {
    view,
    ...inputs
  },
  where,
  children,
}: PropsWithChildren<{
  input: ActorContextInput
  where?: WhereOperator<string, string> | undefined
}>) {
  const handlersRef = useDiagramEventHandlersRef()
  const xystore = useStoreApi<Types.Node, Types.Edge>()

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
        syncManualLayoutActorLogic: syncManualLayoutActorLogic.provide({
          actions: {
            'trigger:OnChange': ((_, params) => {
              console.log('trigger:OnChange', params)
              handlersRef.current.onChange?.(params)
            }),
          },
        }),
      },
    }),
    {
      id: `diagram:${view.id}`,
      systemId: 'diagram',
      ...inspector,
      input: {
        xystore,
        view,
        ...inputs,
      },
    },
  )

  const features = useEnabledFeatures()
  useUpdateEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs })
  }, [inputs])

  useEffect(() => {
    actorRef.send({ type: 'update.features', features })
  }, [features])

  const { xyedges, xynodes } = useViewToNodesEdges({
    view,
    where,
    nodesSelectable: inputs.nodesSelectable,
  })

  useDeepCompareEffect(() => {
    actorRef.send({ type: 'update.view', view, xyedges, xynodes })
  }, [view, xyedges, xynodes])

  const toggledFeatures = useSelector(actorRef, selectToggledFeatures, shallowEqual)

  return (
    <DiagramActorSafeContext value={actorRef}>
      <DiagramFeatures overrides={toggledFeatures}>
        {children}
      </DiagramFeatures>
    </DiagramActorSafeContext>
  )
}
