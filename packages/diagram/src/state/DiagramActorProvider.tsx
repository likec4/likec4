import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types'
import { useCustomCompareEffect, useRafEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useMemo, useRef } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useDiagramEventHandlers } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { useOnDiagramEvent } from '../custom'
import { DiagramActorContextProvider } from '../hooks/safeContext'
import type { ViewPadding } from '../LikeC4Diagram.props'
import { convertToXYFlow } from '../likec4diagram/convert-to-xyflow'
import type { Types } from '../likec4diagram/types'
import { CurrentViewModelContext } from '../likec4model/LikeC4ModelContext'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import { type DiagramMachine, diagramMachine } from './diagram-machine'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorRef, DiagramActorSnapshot } from './types'

const selectDynamicViewVariant = (state: DiagramActorSnapshot) => {
  return state.context.dynamicViewVariant
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
        dynamicViewVariant: _defaultVariant,
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

  const dynamicViewVariant = useSelector(actorRef, selectDynamicViewVariant)

  const update = useMemo(
    () => convertToXYFlow({ view, where, nodesSelectable, dynamicViewVariant }),
    [view, where, nodesSelectable, dynamicViewVariant],
  )

  useRafEffect(() => {
    actorRef.send({
      type: 'update.view',
      ...update,
    })
  }, [actorRef, update])

  return (
    <DiagramActorContextProvider value={actorRef}>
      <ErrorBoundary>
        <CurrentViewModelProvider actorRef={actorRef}>
          {children}
        </CurrentViewModelProvider>
      </ErrorBoundary>
      <DiagramActorEventListener actorRef={actorRef} />
    </DiagramActorContextProvider>
  )
}

const selectViewIdAndToggledFeatures = (state: DiagramActorSnapshot) => {
  if (state.context.features.enableReadOnly || state.context.activeWalkthrough) {
    return {
      viewId: state.context.view.id,
      toggledFeatures: {
        ...state.context.toggledFeatures,
        enableReadOnly: true,
      },
    }
  }
  return {
    viewId: state.context.view.id,
    toggledFeatures: state.context.toggledFeatures,
  }
}
function CurrentViewModelProvider({ children, actorRef }: PropsWithChildren<{ actorRef: DiagramActorRef }>) {
  const { viewId, toggledFeatures } = useSelector(actorRef, selectViewIdAndToggledFeatures, deepEqual)
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

function DiagramActorEventListener({ actorRef }: { actorRef: DiagramActorRef }) {
  const {
    onNavigateTo,
    onOpenSource,
  } = useDiagramEventHandlers()

  useOnDiagramEvent('openSource', ({ params }) => onOpenSource?.(params))
  useOnDiagramEvent('navigateTo', ({ viewId }) => onNavigateTo?.(viewId))

  return null
}
