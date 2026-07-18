import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types'
import { useActorRef } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, memo, useEffect, useRef, useState } from 'react'
import { isNullish } from 'remeda'
import { useDiagramEventHandlersRef } from '../../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../../context/DiagramFeatures'
import { useEditorActorLogic } from '../../editor/useEditorActorLogic'
import { DiagramActorContextProvider, DiagramApiContextProvider } from '../../hooks/safeContext'
import {
  selectDiagramActorContext,
  useDiagram,
  useDiagramSnapshot,
  useOnDiagramEvent,
} from '../../hooks/useDiagram'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { ViewPaddings } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { DiagramApi } from './diagram-api'
import { diagramMachine } from './machine'
import { DiagramToggledFeaturesPersistence } from './persistence'

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

  const editor = useEditorActorLogic()
  const features = useEnabledFeatures()

  const actor = useActorRef(
    diagramMachine.provide({
      actors: {
        editor,
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
        features,
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

  useEffect(() => {
    actor.send({ type: 'update.features', features })
  }, [actor, features])

  useUpdateEffect(
    () =>
      actor.send({
        type: 'update.inputs',
        inputs: { zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable },
      }),
    [actor, zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable],
  )

  useUpdateEffect(() => {
    if (!_defaultVariant) return
    actor.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant })
  }, [actor, _defaultVariant])

  useEffect(
    () => actor.send({ type: 'update.view', view, source: 'external' }),
    [actor, view],
  )

  return (
    <DiagramActorContextProvider value={actor}>
      <DiagramApiContextProvider value={DiagramApi.withActor(actorRef)}>
        <ToggledFeatures>
          {children}
        </ToggledFeatures>
        <PropagateDiagramActorEvents />
      </DiagramApiContextProvider>
    </DiagramActorContextProvider>
  )
}

const selectToggledFeatures = selectDiagramActorContext(context => {
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

  return toggledFeatures
})

function ToggledFeatures({ children }: PropsWithChildren) {
  const toggledFeatures = useDiagramSnapshot(selectToggledFeatures)
  useUpdateEffect(() => {
    DiagramToggledFeaturesPersistence.write(toggledFeatures)
  }, [toggledFeatures])
  return (
    <DiagramFeatures overrides={toggledFeatures}>
      {children}
    </DiagramFeatures>
  )
}

const PropagateDiagramActorEvents = memo(() => {
  const diagram = useDiagram()

  const handlers = useDiagramEventHandlersRef()

  useOnDiagramEvent('openSource', ({ params }) => handlers.current.onOpenSource?.(params))
  useOnDiagramEvent('navigateTo', ({ viewId }) => handlers.current.onNavigateTo?.(viewId))
  // useOnDiagramEvent('onChange', ({ change }) => handlers.current.onChange?.({ change }))
  useOnDiagramEvent('onLayoutTypeChange', ({ layoutType }) => {
    handlers.current.onLayoutTypeChange?.(layoutType)
  })
  useOnDiagramEvent(
    'initialized',
    ({ instance: xyflow }) => {
      try {
        handlers.current.onInitialized?.({ diagram, xyflow })
      } catch (error) {
        console.error(error)
      }
    },
    { once: true },
  )

  return null
})
