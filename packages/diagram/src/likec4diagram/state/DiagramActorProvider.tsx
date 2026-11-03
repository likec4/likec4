// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types'
import { useActorRef } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect } from 'react'
import { MaxZoom, MinZoom } from '../../base/const'
import { ComparingLayoutsProvider } from '../../context/ComparingLayoutsContext'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../../context/DiagramFeatures'
import { useEditorActorLogic } from '../../editor/useEditorActorLogic'
import {
  DiagramActorContextProvider,
  DiagramApiContextProvider,
  selectDiagramSnapshot,
  useDiagramSelector,
} from '../../hooks/safeContext'
import {
  useDiagram,
  useOnDiagramEvent,
} from '../../hooks/useDiagram'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { RelationshipBrowserScope, ViewPaddings } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { DiagramApi } from './diagram-api'
import { diagramMachine } from './machine'
import { deriveToggledFeatures, isComparingLayouts } from './machine.setup'
import { DiagramToggledFeaturesPersistence } from './persistence'

export function DiagramActorProvider({
  id,
  view,
  zoomable,
  pannable,
  fitView,
  initialZoom,
  nodesDraggable,
  nodesSelectable,
  fitViewPadding,
  where = null,
  minZoom = MinZoom,
  maxZoom = MaxZoom,
  children,
  dynamicViewVariant: _defaultVariant,
  relationshipBrowserScope,
}: PropsWithChildren<{
  id: string
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  fitView: boolean
  initialZoom?: number | undefined
  minZoom?: number | undefined
  maxZoom?: number | undefined
  nodesDraggable: boolean
  nodesSelectable: boolean
  fitViewPadding: ViewPaddings
  where?: WhereOperator | null
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined
  relationshipBrowserScope: RelationshipBrowserScope
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
        fitView,
        initialZoom,
        minZoom,
        maxZoom,
        fitViewPadding,
        nodesDraggable,
        nodesSelectable,
        where,
        features,
        dynamicViewVariant: _defaultVariant,
        relationshipBrowserScope,
      },
    },
  )

  useEffect(() => {
    actor.send({ type: 'update.features', features })
  }, [actor, features])

  useUpdateEffect(
    () =>
      actor.send({
        type: 'update.inputs',
        inputs: {
          zoomable,
          where,
          pannable,
          fitView,
          initialZoom,
          minZoom,
          maxZoom,
          fitViewPadding,
          nodesDraggable,
          nodesSelectable,
          relationshipBrowserScope,
        },
      }),
    [
      actor,
      zoomable,
      where,
      pannable,
      fitView,
      initialZoom,
      minZoom,
      maxZoom,
      fitViewPadding,
      nodesDraggable,
      nodesSelectable,
      relationshipBrowserScope,
    ],
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
      <DiagramApiContextProvider value={DiagramApi.withActor(actor)}>
        <ToggledFeatures>
          {children}
        </ToggledFeatures>
        <PropagateDiagramActorEvents />
      </DiagramApiContextProvider>
    </DiagramActorContextProvider>
  )
}

const selectToggledFeatures = selectDiagramSnapshot((snapshot) => ({
  toggledFeatures: deriveToggledFeatures(snapshot),
  isComparing: isComparingLayouts(snapshot),
}), deepEqual)

function ToggledFeatures({ children }: PropsWithChildren) {
  const { toggledFeatures, isComparing } = useDiagramSelector(selectToggledFeatures)
  useUpdateEffect(() => {
    DiagramToggledFeaturesPersistence.write(toggledFeatures)
  }, [toggledFeatures])
  return (
    <DiagramFeatures overrides={toggledFeatures}>
      <ComparingLayoutsProvider value={isComparing}>
        {children}
      </ComparingLayoutsProvider>
    </DiagramFeatures>
  )
}

function PropagateDiagramActorEvents() {
  const diagram = useDiagram()

  const handlers = useDiagramEventHandlers()

  useOnDiagramEvent('openSource', ({ params }) => {
    return handlers.onOpenSource?.(params)
  })
  useOnDiagramEvent('navigateTo', ({ viewId }) => handlers.onNavigateTo?.(viewId))
  // useOnDiagramEvent('onChange', ({ change }) => handlers.onChange?.({ change }))
  useOnDiagramEvent('onLayoutTypeChange', ({ layoutType }) => {
    handlers.onLayoutTypeChange?.(layoutType)
  })
  useOnDiagramEvent(
    'initialized',
    ({ instance: xyflow }) => {
      try {
        handlers.onInitialized?.({ diagram, xyflow })
      } catch (error) {
        console.error(error)
      }
    },
    { once: true },
  )

  return null
}
