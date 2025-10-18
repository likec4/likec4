import type { DiagramView, DynamicViewDisplayVariant, ViewId, WhereOperator } from '@likec4/core/types'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, memo, useEffect, useRef } from 'react'
import type { Subscription } from 'xstate'
import { ErrorBoundary } from '../../components/ErrorFallback'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../../context/DiagramFeatures'
import { CurrentViewModelContext } from '../../context/LikeC4ModelContext'
import { DiagramActorContextProvider } from '../../hooks/safeContext'
import { useDiagram, useOnDiagramEvent } from '../../hooks/useDiagram'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { ViewPadding } from '../../LikeC4Diagram.props'
import { convertToXYFlow } from '../convert-to-xyflow'
import type { Types } from '../types'
import { type DiagramMachineLogic, diagramMachine } from './diagram-machine'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorSnapshot } from './types'

const selectFromActor = (state: DiagramActorSnapshot) => {
  if (state.context.features.enableReadOnly || state.context.activeWalkthrough) {
    return {
      dynamicViewVariant: state.context.dynamicViewVariant,
      viewId: state.context.view.id,
      toggledFeatures: {
        ...state.context.toggledFeatures,
        enableReadOnly: true,
      },
    }
  }
  return {
    dynamicViewVariant: state.context.dynamicViewVariant,
    viewId: state.context.view.id,
    toggledFeatures: state.context.toggledFeatures,
  }
}
const compareSelected = <T extends ReturnType<typeof selectFromActor>>(a: T, b: T): boolean => {
  return a.viewId === b.viewId && a.dynamicViewVariant === b.dynamicViewVariant &&
    shallowEqual(a.toggledFeatures, b.toggledFeatures)
}

export function DiagramActorProvider({
  view,
  zoomable,
  pannable,
  fitViewPadding,
  nodesSelectable,
  where,
  children,
  dynamicViewVariant: _defaultVariant,
}: PropsWithChildren<{
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  fitViewPadding: ViewPadding
  nodesSelectable: boolean
  where: WhereOperator | null
  dynamicViewVariant: DynamicViewDisplayVariant | undefined
}>) {
  const { handlersRef } = useDiagramEventHandlers()
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const machineRef = useRef<DiagramMachineLogic | null>(null)
  if (!machineRef.current) {
    machineRef.current = diagramMachine.provide({
      actions: {
        'trigger:OnChange': ((_, params) => {
          handlersRef.current.onChange?.(params)
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
        dynamicViewVariant: _defaultVariant,
      },
    },
  )

  const features = useEnabledFeatures()
  useEffect(
    () => actorRef.send({ type: 'update.features', features }),
    [features],
  )

  useEffect(
    () =>
      actorRef.send({
        type: 'update.inputs',
        inputs: { zoomable, pannable, fitViewPadding, nodesSelectable },
      }),
    [zoomable, pannable, fitViewPadding, nodesSelectable],
  )

  const { dynamicViewVariant, viewId, toggledFeatures } = useSelector(
    actorRef,
    selectFromActor,
    compareSelected,
  )

  useUpdateEffect(() => {
    if (!_defaultVariant) return
    actorRef.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant })
  }, [_defaultVariant])

  useEffect(() => {
    actorRef.send({
      type: 'update.view',
      ...convertToXYFlow({ view, where, nodesSelectable, dynamicViewVariant }),
    })
  }, [actorRef, view, where, nodesSelectable, dynamicViewVariant])

  return (
    <DiagramActorContextProvider value={actorRef}>
      <ErrorBoundary>
        <DiagramFeatures overrides={toggledFeatures}>
          {/* Important - we use "viewId" from actor context, not from props */}
          <CurrentViewModelProvider viewId={viewId}>
            {children}
          </CurrentViewModelProvider>
        </DiagramFeatures>
      </ErrorBoundary>
      <DiagramActorEventListener />
    </DiagramActorContextProvider>
  )
}

function CurrentViewModelProvider({ children, viewId }: PropsWithChildren<{ viewId: ViewId }>) {
  const likec4model = useLikeC4Model()
  const viewmodel = likec4model.findView(viewId)
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      {children}
    </CurrentViewModelContext.Provider>
  )
}

const DiagramActorEventListener = memo(() => {
  const diagram = useDiagram()

  const {
    onNavigateTo,
    onOpenSource,
    handlersRef,
  } = useDiagramEventHandlers()

  useOnDiagramEvent('openSource', ({ params }) => onOpenSource?.(params))
  useOnDiagramEvent('navigateTo', ({ viewId }) => onNavigateTo?.(viewId))

  const wasEmitted = useRef(false)

  useEffect(() => {
    if (wasEmitted.current) return

    let subscription: Subscription | null = diagram.actor.on(
      'initialized',
      ({ instance: xyflow }) => {
        try {
          handlersRef.current.onInitialized?.({ diagram, xyflow })
        } catch (error) {
          console.error(error)
        }
        wasEmitted.current = true
        subscription?.unsubscribe()
        subscription = null
      },
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [diagram.actor, diagram])

  return null
})
