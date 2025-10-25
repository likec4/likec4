import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, memo, useEffect, useMemo, useRef } from 'react'
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
import type { DiagramActorRef, DiagramActorSnapshot } from './types'

export function DiagramActorProvider({
  view,
  zoomable,
  pannable,
  fitViewPadding,
  where,
  children,
  dynamicViewVariant: _defaultVariant,
}: PropsWithChildren<{
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  fitViewPadding: ViewPadding
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
        inputs: { zoomable, pannable, fitViewPadding },
      }),
    [zoomable, pannable, fitViewPadding],
  )

  useUpdateEffect(() => {
    if (!_defaultVariant) return
    actorRef.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant })
  }, [_defaultVariant])

  return (
    <DiagramActorContextProvider value={actorRef}>
      <ErrorBoundary>
        <CurrentViewModelProvider actorRef={actorRef}>
          {children}
          <DiagramXYFlowSyncProvider
            view={view}
            where={where}
            actorRef={actorRef}
          />
        </CurrentViewModelProvider>
      </ErrorBoundary>
      <DiagramActorEventListener />
    </DiagramActorContextProvider>
  )
}

const selectFromActor = (state: DiagramActorSnapshot) => {
  const isReadOnly = state.context.features.enableReadOnly || !!state.context.activeWalkthrough
  if (isReadOnly !== state.context.toggledFeatures.enableReadOnly) {
    return {
      toggledFeatures: {
        ...state.context.toggledFeatures,
        enableReadOnly: true,
      },
      viewId: state.context.view.id,
    }
  }
  return {
    toggledFeatures: state.context.toggledFeatures,
    viewId: state.context.view.id,
  }
}
const compareSelected = <T extends ReturnType<typeof selectFromActor>>(a: T, b: T): boolean => {
  return a.viewId === b.viewId &&
    shallowEqual(a.toggledFeatures, b.toggledFeatures)
}

function CurrentViewModelProvider({ children, actorRef }: PropsWithChildren<{ actorRef: DiagramActorRef }>) {
  {/* Important - we use "viewId" from actor context, not from props */}
  const { viewId, toggledFeatures } = useSelector(
    actorRef,
    selectFromActor,
    compareSelected,
  )
  const likec4model = useLikeC4Model()
  const viewmodel = likec4model.findView(viewId)
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      <DiagramFeatures overrides={toggledFeatures}>
        {children}
      </DiagramFeatures>
    </CurrentViewModelContext.Provider>
  )
}

const selectFromActor2 = (state: DiagramActorSnapshot) => {
  return {
    dynamicViewVariant: state.context.dynamicViewVariant,
  }
}
function DiagramXYFlowSyncProvider(
  { view, where, actorRef }: {
    view: DiagramView
    where: WhereOperator | null
    actorRef: DiagramActorRef
  },
) {
  // const { enableReadOnly } = useEnabledFeatures()
  const { dynamicViewVariant } = useSelector(actorRef, selectFromActor2, shallowEqual)

  useEffect(() => {
    actorRef.send({
      type: 'update.view',
      ...convertToXYFlow({ view, where, dynamicViewVariant }),
    })
  }, [view, where, dynamicViewVariant])

  return null
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
