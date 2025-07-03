import type { DiagramView, WhereOperator } from '@likec4/core/types'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useDiagramEventHandlersRef } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { DiagramActorContextProvider } from '../hooks/safeContext'
import { useCurrentViewId } from '../hooks/useCurrentViewId'
import type { PaddingWithUnit } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import { useViewToNodesEdges } from '../likec4diagram/useViewToNodesEdges'
import { CurrentViewModelContext } from '../likec4model/LikeC4ModelContext'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import { type DiagramMachine, diagramMachine } from './diagram-machine'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorSnapshot } from './types'

const selectToggledFeatures = (state: DiagramActorSnapshot) => {
  if (state.context.features.enableReadOnly) {
    return {
      ...state.context.toggledFeatures,
      enableReadOnly: true,
    }
  }
  return state.context.toggledFeatures
}

export function DiagramActorProvider({
  view,
  zoomable,
  pannable,
  fitViewPadding,
  nodesSelectable,
  where,
  children,
}: PropsWithChildren<{
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  fitViewPadding: PaddingWithUnit
  nodesSelectable: boolean
  where: WhereOperator | null
}>) {
  const handlersRef = useDiagramEventHandlersRef()
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const machineRef = useRef<DiagramMachine | null>(null)
  if (!machineRef.current) {
    machineRef.current = diagramMachine.provide({
      actions: {
        'trigger:NavigateTo': ((_, { viewId }) => {
          // Slightly defer callback for better responsiveness
          setTimeout(() => {
            handlersRef.current.onNavigateTo?.(viewId)
          }, 40)
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
              handlersRef.current.onChange?.(params)
            }),
          },
        }),
      },
    })
  }

  const actorRef = useActorRef(
    machineRef.current,
    {
      id: `diagram`,
      systemId: 'diagram',
      // ...inspector,
      input: {
        xystore,
        view,
        zoomable,
        pannable,
        fitViewPadding,
        nodesSelectable,
      },
    },
  )

  const features = useEnabledFeatures()
  useEffect(() => {
    actorRef.send({ type: 'update.features', features })
  }, [features])

  useEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { zoomable, pannable, fitViewPadding, nodesSelectable } })
  }, [zoomable, pannable, fitViewPadding, nodesSelectable])

  const { xyedges, xynodes } = useViewToNodesEdges({
    view,
    where,
    nodesSelectable,
  })

  useEffect(() => {
    actorRef.send({ type: 'update.view', view, xyedges, xynodes })
  }, [view, xyedges, xynodes])

  const toggledFeatures = useSelector(actorRef, selectToggledFeatures, shallowEqual)

  return (
    <DiagramActorContextProvider value={actorRef}>
      <DiagramFeatures overrides={toggledFeatures}>
        <CurrentViewModelProvider>
          {children}
        </CurrentViewModelProvider>
      </DiagramFeatures>
    </DiagramActorContextProvider>
  )
}

function CurrentViewModelProvider({
  children,
}: PropsWithChildren) {
  const viewId = useCurrentViewId()
  const likec4model = useLikeC4Model()
  const [viewmodel, setViewmodel] = useState(() => likec4model.findView(viewId))

  useEffect(() => {
    setViewmodel(likec4model.findView(viewId))
  }, [likec4model, viewId])

  if (!viewmodel) {
    throw new Error(`View "${viewId}" not found`)
  }
  if (!viewmodel.isDiagram()) {
    throw new Error(`View "${viewId}" is not diagram`)
  }
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      {children}
    </CurrentViewModelContext.Provider>
  )
}
