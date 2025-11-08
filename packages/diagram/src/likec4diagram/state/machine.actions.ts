// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
import {
  BBox,
  getParallelStepsPrefix,
  invariant,
  isStepEdgeId,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import type {
  DiagramEdge,
  DiagramNode,
  DiagramView,
  DynamicViewDisplayVariant,
  EdgeId,
  Fqn,
  LayoutType,
  NodeId,
  NodeNotation as ElementNotation,
  StepEdgeId,
  ViewChange,
  ViewId,
  XYPoint,
} from '@likec4/core/types'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import { type EdgeChange, type NodeChange, type Rect, type Viewport, nodeToRect } from '@xyflow/system'
import { produce } from 'immer'
import type { MouseEvent } from 'react'
import { clamp, first, hasAtLeast, prop } from 'remeda'
import type { PartialDeep } from 'type-fest'
import {
  and,
  assertEvent,
  assign,
  cancel,
  emit,
  enqueueActions,
  forwardTo,
  or,
  raise,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { Base, MinZoom } from '../../base'
import { type EnabledFeatures, type FeatureName, DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { OpenSourceParams, ViewPadding } from '../../LikeC4Diagram.props'
import { overlaysActorLogic } from '../../overlays/overlaysActor'
import { searchActorLogic } from '../../search/searchActor'
import type { Types } from '../types'
import { createLayoutConstraints } from '../useLayoutConstraints'
import { SeqParallelAreaColor } from '../xyflow-sequence/const'
import { type AlignmentMode, getAligner, toNodeRect } from './aligners'
import {
  focusNodesEdges,
  lastClickedNode,
  mergeXYNodesEdges,
  navigateBack,
  navigateForward,
  resetEdgeControlPoints,
  resetEdgesControlPoints,
  updateActiveWalkthrough,
  updateEdgeData,
  updateNavigationHistory,
  updateNodeData,
} from './assign'
import { createViewChange } from './createViewChange'
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { machine } from './machine.setup'
import { DiagramToggledFeaturesPersistence } from './persistence'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import {
  activeSequenceBounds,
  findDiagramEdge,
  findDiagramNode,
  focusedBounds,
  typedSystem,
} from './utils'

export const trigger = {
  navigateTo: machine.emit(({ context }) => ({
    type: 'navigateTo',
    viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
  })),
}

export const xyflow = {
  fitDiagram: (params?: { duration?: number; bounds?: BBox }) =>
    machine.createAction(({ context, event }) => {
      params ??= event.type === 'fitDiagram' ? event : {}
      const {
        bounds = context.view.bounds,
        duration = 450,
      } = params
      const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

      const maxZoom = Math.max(1, transform[2])
      const viewport = getViewportForBounds(
        bounds,
        width,
        height,
        MinZoom,
        maxZoom,
        context.fitViewPadding,
      )
      viewport.x = Math.round(viewport.x)
      viewport.y = Math.round(viewport.y)
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined).catch(
        console.error,
      )
    }),

  fitFocusedBounds: machine.createAction(({ context }) => {
    const isActiveSequenceWalkthrough = !!context.activeWalkthrough && context.dynamicViewVariant === 'sequence'
    const { bounds, duration = 450 } = isActiveSequenceWalkthrough
      ? activeSequenceBounds({ context })
      : focusedBounds({ context })
    const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

    const maxZoom = Math.max(1, transform[2])
    const viewport = getViewportForBounds(
      bounds,
      width,
      height,
      MinZoom,
      maxZoom,
      context.fitViewPadding,
    )
    viewport.x = Math.round(viewport.x)
    viewport.y = Math.round(viewport.y)
    panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined)
  }),
}

export const disableCompareWithLatest = machine.assign(({ context }) => {
  return {
    toggledFeatures: {
      ...context.toggledFeatures,
      enableCompareWithLatest: false,
    },
    viewportOnAutoLayout: null,
    viewportOnManualLayout: null,
  }
})

export const onEdgeDoubleClick = machine.assign(({ context, event }) => {
  assertEvent(event, 'xyflow.edgeDoubleClick')
  if (!event.edge.data.controlPoints) {
    return {}
  }
  const { nodeLookup } = context.xystore.getState()
  return {
    xyedges: context.xyedges.map(e => {
      if (e.id === event.edge.id) {
        return produce(e, draft => {
          const cp = resetEdgeControlPoints(nodeLookup, e)
          draft.data.controlPoints = cp
          if (hasAtLeast(cp, 1) && draft.data.labelBBox) {
            draft.data.labelBBox.x = cp[0].x
            draft.data.labelBBox.y = cp[0].y
            draft.data.labelXY = cp[0]
          }
        })
      }
      return e
    }),
  }
})

export const emitOnChange = machine.enqueueActions(({ event, enqueue }) => {
  assertEvent(event, 'emit.onChange')
  enqueue.assign({
    viewportChangedManually: true,
  })
  enqueue.emit({
    type: 'onChange',
    change: event.change,
  })
})

export const emitOnLayoutTypeChange = machine.enqueueActions(({ event, system, context, enqueue }) => {
  if (!context.features.enableCompareWithLatest) {
    console.warn('Layout type cannot be changed while CompareWithLatest feature is disabled')
    return
  }
  const currentLayoutType = context.view._layout
  // toggle
  let nextLayoutType: LayoutType = currentLayoutType === 'auto' ? 'manual' : 'auto'

  if (event.type === 'emit.onLayoutTypeChange') {
    nextLayoutType = event.layoutType
  }

  if (currentLayoutType === nextLayoutType) {
    console.warn('Ignoring layout type change event, layout type is already', currentLayoutType)
    return
  }

  if (context.toggledFeatures.enableCompareWithLatest === true) {
    // Check if we are switching from manual to auto layout while a sync is pending
    if (currentLayoutType === 'manual' && nextLayoutType === 'auto') {
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      const syncState = syncLayoutActor?.getSnapshot().value
      const isPending = syncLayoutActor && (syncState === 'pending' || syncState === 'paused')
      if (isPending) {
        enqueue.sendTo(syncLayoutActor, { type: 'cancel' })
        enqueue.emit({
          type: 'onChange',
          change: createViewChange(context),
        })
      }
    }

    const currentViewport = context.viewport
    if (currentLayoutType === 'auto') {
      enqueue.assign({
        viewportOnAutoLayout: currentViewport,
      })
    }
    if (currentLayoutType === 'manual') {
      enqueue.assign({
        viewportOnManualLayout: currentViewport,
      })
    }
  }

  enqueue.emit({
    type: 'onLayoutTypeChange',
    layoutType: nextLayoutType,
  })
})
