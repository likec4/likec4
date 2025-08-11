import type { DiagramView, ViewId, WhereOperator } from '@likec4/core/types'
import { useCustomCompareEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { DEV } from 'esm-env'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useDiagramEventHandlers } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { DiagramActorContextProvider } from '../hooks/safeContext'
import type { ViewPadding } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import { useViewToNodesEdges } from '../likec4diagram/useViewToNodesEdges'
import { CurrentViewModelContext } from '../likec4model/LikeC4ModelContext'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import { type DiagramMachine, diagramMachine } from './diagram-machine'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorRef, DiagramActorSnapshot } from './types'

const selectToggledFeatures = (state: DiagramActorSnapshot) => {
  if (state.context.features.enableReadOnly || state.context.activeWalkthrough) {
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
  fitViewPadding: ViewPadding
  nodesSelectable: boolean
  where: WhereOperator | null
}>) {
  const { handlersRef } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const machineRef = useRef<DiagramMachine | null>(null)
  if (!machineRef.current) {
    machineRef.current = diagramMachine.provide({
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

  useActorEventHandlers(actorRef)

  const features = useEnabledFeatures()
  useCustomCompareEffect(
    () => {
      actorRef.send({ type: 'update.features', features })
    },
    [features],
    shallowEqual,
  )

  useCustomCompareEffect(
    () => {
      actorRef.send({ type: 'update.inputs', inputs: { zoomable, pannable, fitViewPadding, nodesSelectable } })
    },
    [zoomable, pannable, fitViewPadding, nodesSelectable],
    deepEqual,
  )

  const { xyedges, xynodes } = useViewToNodesEdges({
    view,
    where,
    nodesSelectable,
  })

  useEffect(() => {
    console.log('update.view', view, xyedges, xynodes)
    actorRef.send({ type: 'update.view', view, xyedges, xynodes })
  }, [view, xyedges, xynodes])

  const toggledFeatures = useSelector(actorRef, selectToggledFeatures, shallowEqual)

  return (
    <DiagramActorContextProvider value={actorRef}>
      <DiagramFeatures overrides={toggledFeatures}>
        <ErrorBoundary>
          <CurrentViewModelProvider viewId={view.id}>
            {children}
          </CurrentViewModelProvider>
        </ErrorBoundary>
      </DiagramFeatures>
    </DiagramActorContextProvider>
  )
}

function CurrentViewModelProvider({
  children,
  viewId,
}: PropsWithChildren<{
  viewId: ViewId
}>) {
  const likec4model = useLikeC4Model()
  const [viewmodel, setViewmodel] = useState(() => likec4model.findView(viewId))

  useEffect(() => {
    setViewmodel(current => {
      const nextviewmodel = likec4model.findView(viewId)
      if (!nextviewmodel) {
        console.error(`View "${viewId}" not found in likec4model, current viewmodel: ${current?.id}`, {
          currentViewModel: current,
          likec4model,
        })
        return current
      }
      if (DEV && !nextviewmodel.isDiagram()) {
        console.warn(`View "${viewId}" is not diagram.\nMake sure you have LikeC4ModelProvider with layouted model.`)
      }
      return nextviewmodel
    })
  }, [likec4model, viewId])

  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      {children}
    </CurrentViewModelContext.Provider>
  )
}

function useActorEventHandlers(
  actorRef: DiagramActorRef,
) {
  const {
    onChange,
    onNavigateTo,
    onOpenSource,
  } = useDiagramEventHandlers()

  useEffect(() => {
    if (!onChange) return
    const subscription = actorRef.on('viewChange', ({ change }) => onChange({ change }))
    return () => subscription.unsubscribe()
  }, [actorRef, onChange])

  useEffect(() => {
    if (!onNavigateTo) return
    let frame: number

    const subscription = actorRef.on('navigateTo', ({ viewId }) => {
      cancelAnimationFrame(frame)
      // Slightly defer callback for better responsiveness
      frame = requestAnimationFrame(() => {
        onNavigateTo(viewId)
      })
    })
    return () => {
      cancelAnimationFrame(frame)
      subscription.unsubscribe()
    }
  }, [actorRef, onNavigateTo])

  useEffect(() => {
    if (!onOpenSource) return
    const subscription = actorRef.on('openSource', ({ params }) => onOpenSource(params))
    return () => subscription.unsubscribe()
  }, [actorRef, onOpenSource])
}
