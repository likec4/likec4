import type { DiagramView, DynamicViewDisplayVariant, ViewId, WhereOperator } from '@likec4/core/types'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, memo, useEffect, useRef, useState } from 'react'
import { isNullish } from 'remeda'
import { ErrorBoundary } from '../../components/ErrorFallback'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { type EnabledFeatures, DiagramFeatures, useEnabledFeatures } from '../../context/DiagramFeatures'
import { CurrentViewModelContext } from '../../context/LikeC4ModelContext'
import { useEditorActorLogic } from '../../editor/useEditorActorLogic'
import { DiagramActorContextProvider, DiagramApiContextProvider } from '../../hooks/safeContext'
import { useDiagram, useDiagramContext, useOnDiagramEvent } from '../../hooks/useDiagram'
import { useOptionalLikeC4Model } from '../../hooks/useLikeC4Model'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { ViewPaddings } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { makeDiagramApi } from './diagram-api'
import { diagramMachine } from './machine'
import { DiagramToggledFeaturesPersistence } from './persistence'
import type { DiagramActorRef, DiagramActorSnapshot } from './types'

export function DiagramActorProvider({
  id,
  view,
  zoomable,
  pannable,
  nodesDraggable,
  nodesSelectable,
  fitViewPadding,
  where = null,
  children,
  dynamicViewVariant: _defaultVariant,
}: PropsWithChildren<{
  id: string
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  fitViewPadding: ViewPaddings
  where?: WhereOperator | null
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined
}>) {
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const editorActor = useEditorActorLogic(view.id)

  const actor = useActorRef(
    diagramMachine.provide({
      actors: {
        editorActor,
      },
    }),
    {
      id: `diagram-${id}`,
      systemId: 'diagram',
      // ...inspector,
      input: {
        xystore,
        view,
        zoomable,
        pannable,
        fitViewPadding,
        nodesDraggable,
        nodesSelectable,
        where,
        dynamicViewVariant: _defaultVariant,
      },
    },
  )
  const actorRef = useRef(actor)
  if (actorRef.current !== actor) {
    console.warn('DiagramMachine actor instance changed', {
      previous: actorRef.current.getSnapshot().context,
      current: actor.getSnapshot().context,
    })
    actorRef.current = actor
  }

  useUpdateEffect(
    () => {
      return () => {
        console.log('DiagramActorProvider unmounting')
        actor.send({ type: 'destroy' })
      }
    },
    [actor],
    Object.is,
  )

  const [api, setApi] = useState(() => makeDiagramApi(actorRef))
  useEffect(() => {
    setApi(api => {
      if (api.ref === actorRef) {
        return api
      }
      console.warn(
        'DiagramMachine actorRef changed, creating new DiagramApi instance, this should not happen during the lifetime of the actor',
      )
      return makeDiagramApi(actorRef)
    })
  }, [actorRef])

  const features = useEnabledFeatures()
  useEffect(
    () => actor.send({ type: 'update.features', features }),
    [features, actor],
  )

  useEffect(
    () =>
      actor.send({
        type: 'update.inputs',
        inputs: { zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable },
      }),
    [zoomable, where, pannable, fitViewPadding, actor, nodesDraggable, nodesSelectable, xystore],
  )

  useUpdateEffect(() => {
    if (!_defaultVariant) return
    actor.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant })
  }, [_defaultVariant, actor])

  useEffect(
    () => actor.send({ type: 'update.view', view, source: 'external' }),
    [actor, view],
  )

  return (
    <DiagramActorContextProvider value={actor}>
      <DiagramApiContextProvider value={api}>
        <ErrorBoundary>
          <CurrentViewModelProvider actorRef={actor}>
            {children}
          </CurrentViewModelProvider>
        </ErrorBoundary>
        <DiagramActorEventListener />
      </DiagramApiContextProvider>
    </DiagramActorContextProvider>
  )
}

const selectFromActor = (
  { context }: DiagramActorSnapshot,
): {
  toggledFeatures: Partial<EnabledFeatures>
  viewId: ViewId
} => {
  let toggledFeatures = context.toggledFeatures

  const hasDrifts = context.view.drifts != null && context.view.drifts.length > 0

  const enableCompareWithLatest = hasDrifts
    && context.features.enableCompareWithLatest
    && (toggledFeatures.enableCompareWithLatest ?? false)
    // Compare with latest is disabled during active walkthrough
    && isNullish(context.activeWalkthrough)

  const enableReadOnly = context.features.enableReadOnly
    || toggledFeatures.enableReadOnly
    // Active walkthrough forces readonly
    || !!context.activeWalkthrough
    // Compare with latest enforces readonly
    || (enableCompareWithLatest && context.view._layout === 'auto')

  // Update toggled features if changed
  if (
    toggledFeatures.enableReadOnly !== enableReadOnly ||
    toggledFeatures.enableCompareWithLatest !== enableCompareWithLatest
  ) {
    toggledFeatures = {
      ...toggledFeatures,
      enableCompareWithLatest,
      enableReadOnly,
    }
  }

  return {
    toggledFeatures,
    viewId: context.view.id,
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
  const likec4model = useOptionalLikeC4Model()
  const viewmodel = likec4model?.findView(viewId) ?? null
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      <DiagramFeatures overrides={toggledFeatures}>
        {children}
      </DiagramFeatures>
    </CurrentViewModelContext.Provider>
  )
}

const DiagramActorEventListener = memo(() => {
  const diagram = useDiagram()

  const {
    onNavigateTo,
    onOpenSource,
    // onChange,
    onLayoutTypeChange,
    handlersRef,
  } = useDiagramEventHandlers()

  useOnDiagramEvent('openSource', ({ params }) => onOpenSource?.(params))
  useOnDiagramEvent('navigateTo', ({ viewId }) => onNavigateTo?.(viewId))
  // useOnDiagramEvent('onChange', ({ change }) => onChange?.({ change }))
  useOnDiagramEvent('onLayoutTypeChange', ({ layoutType }) => {
    onLayoutTypeChange?.(layoutType)
  })
  useOnDiagramEvent(
    'initialized',
    ({ instance: xyflow }) => {
      try {
        handlersRef.current.onInitialized?.({ diagram, xyflow })
      } catch (error) {
        console.error(error)
      }
    },
    { once: true },
  )

  const toggledFeatures = useDiagramContext(
    (ctx) => ctx.toggledFeatures,
    shallowEqual,
  )

  useUpdateEffect(() => {
    DiagramToggledFeaturesPersistence.write(toggledFeatures)
  }, [toggledFeatures])

  return null
})
