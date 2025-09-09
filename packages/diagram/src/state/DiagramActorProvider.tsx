import type { DiagramView, WhereOperator } from '@likec4/core/types'
import { useCustomCompareEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useDiagramEventHandlers } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { useOnDiagramEvent } from '../custom'
import { DiagramActorContextProvider } from '../hooks/safeContext'
import { useCurrentViewId } from '../hooks/useCurrentViewId'
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
    actorRef.send({ type: 'update.view', view, xyedges, xynodes })
  }, [view, xyedges, xynodes])

  const toggledFeatures = useSelector(actorRef, selectToggledFeatures, shallowEqual)

  return (
    <DiagramActorContextProvider value={actorRef}>
      <DiagramFeatures overrides={toggledFeatures}>
        <ErrorBoundary>
          <CurrentViewModelProvider>
            {children}
          </CurrentViewModelProvider>
        </ErrorBoundary>
      </DiagramFeatures>
      <DiagramActorEventListener actorRef={actorRef} />
    </DiagramActorContextProvider>
  )
}

function CurrentViewModelProvider({ children }: PropsWithChildren) {
  const viewId = useCurrentViewId()
  const likec4model = useLikeC4Model()
  const viewmodel = likec4model.findView(viewId)
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      {children}
    </CurrentViewModelContext.Provider>
  )
}

function DiagramActorEventListener({ actorRef }: { actorRef: DiagramActorRef }) {
  const {
    onNavigateTo,
    onOpenSource,
  } = useDiagramEventHandlers()

  useOnDiagramEvent('openSource', ({ params }) => onOpenSource?.(params))

  // onNavigateTo we defer the callback for better responsiveness
  // (allowing animation to finish)
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

  return null
}
