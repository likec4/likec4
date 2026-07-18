// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
import {
  BBox,
  invariant,
  isNonEmptyArray,
  nonNullable,
} from '@likec4/core'
import type {
  DiagramView,
  XYPoint,
} from '@likec4/core/types'
import type { Viewport } from '@xyflow/react'
import {
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react'
import {
  assertEvent,
} from 'xstate'
import { MinZoom } from '../../base'
import { calcEdgeBounds } from '../../utils/view-bounds'
import { type Context, isActiveSequenceWalkthrough, machine } from './machine.setup'
import {
  activeSequenceBounds,
  focusedBounds,
  getEdgeBounds,
  viewBounds,
} from './utils'

const calcMaxZoom = (context: Context, transform: [number, number, number] = [0, 0, 1]) => {
  const [, , zoom] = transform
  if (isActiveSequenceWalkthrough(context)) {
    return Math.max(zoom, 1.4)
  }
  return Math.max(zoom, 1)
}

export const setViewport = (params?: { viewport: Viewport; duration?: number }) =>
  machine.createAction(({ context, event }) => {
    let viewport: Viewport, duration: number | undefined
    if (params) {
      viewport = params.viewport
      duration = params.duration
    } else {
      assertEvent(event, 'xyflow.setViewport')
      viewport = event.viewport
      duration = event.duration
    }
    duration = duration ?? 450
    const { panZoom } = nonNullable(context.xystore).getState()
    const animationProps = duration > 0 ? { duration, interpolate: 'smooth' as const } : undefined

    panZoom?.setViewport({
      x: Math.round(viewport.x),
      y: Math.round(viewport.y),
      zoom: viewport.zoom,
    }, animationProps).catch((err) => {
      console.error('Error during setViewport', { err })
    })
  })

export const setViewportCenter = (params?: { x: number; y: number }) =>
  machine.createAction(({ context, event }) => {
    let center: XYPoint
    if (params) {
      center = params
    } else if (event.type === 'update.view') {
      center = BBox.center(viewBounds(context, event.view))
    } else {
      center = BBox.center(viewBounds(context))
    }
    invariant(context.xyflow, 'xyflow is not initialized')
    const zoom = context.xyflow.getZoom()
    context.xyflow.setCenter(
      Math.round(center.x),
      Math.round(center.y),
      { zoom },
    ).catch((err) => {
      console.error('Error during setViewportCenter', { err })
    })
  })

export const centerOnNodeOrEdge = () =>
  machine.raise(({ context, event }) => {
    assertEvent(event, 'xyflow.centerViewport')
    const xystate = context.xystore.getState()
    if ('edgeId' in event) {
      const edge = xystate.edgeLookup.get(event.edgeId)
      if (!edge) {
        return { type: 'noop' } as never
      }
      let bounds = calcEdgeBounds({
        points: edge.data.points,
        controlPoints: edge.data.controlPoints && isNonEmptyArray(edge.data.controlPoints)
          ? edge.data.controlPoints
          : null,
        labelBBox: edge.data.labelBBox ?? null,
      })
      const edgeBounds = getEdgeBounds(edge, xystate)
      if (edgeBounds) {
        bounds = BBox.merge(bounds, edgeBounds)
      }

      return {
        type: 'xyflow.fitDiagram',
        bounds,
      }
    }

    const node = xystate.nodeLookup.get(event.nodeId)
    if (!node) {
      return { type: 'noop' } as never
    }
    const bounds = getNodesBounds([node], xystate)
    return {
      type: 'xyflow.fitDiagram',
      bounds,
    }
  })

function fitBoundsInViewport(context: Context, bounds: BBox, duration: number) {
  let { width, height, panZoom, transform } = nonNullable(context.xystore).getState()
  let left = undefined

  if (isActiveSequenceWalkthrough(context)) {
    left = context.activeWalkthrough.outlinePanelWidth
    width -= left
  }

  const maxZoom = calcMaxZoom(context, transform)
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
  if (left !== undefined) {
    viewport.x += left
  }

  const animationProps = duration > 0 ? { duration, interpolate: 'smooth' as const } : undefined

  panZoom?.setViewport(viewport, animationProps).catch((err) => {
    console.error('Error during fitDiagram panZoom setViewport', { err })
  })
}

export const fitDiagram = (params?: { duration?: number; bounds?: BBox }) =>
  machine.createAction(({ context, event }) => {
    let bounds: BBox | undefined, duration: number | undefined
    if (params) {
      bounds = params.bounds
      duration = params.duration
    } else if (event.type === 'xyflow.fitDiagram') {
      bounds = event.bounds
      duration = event.duration
    }
    // Default values
    bounds ??= viewBounds(context)
    duration ??= 450
    fitBoundsInViewport(context, bounds, duration)
  })

export const fitFocusedBounds = (params?: { duration?: number }) =>
  machine.createAction(({ context }) => {
    const isActiveWalkthrough = !!context.activeWalkthrough
    let { bounds, duration = 450 } = isActiveWalkthrough
      ? activeSequenceBounds({ context })
      : focusedBounds({ context })

    // Priority from params
    duration = params?.duration ?? duration
    fitBoundsInViewport(context, bounds, duration)
  })

const DEFAULT_DELAY = 30
export const raiseSetViewport = (params: { delay?: number; duration?: number; viewport: Viewport }) => {
  const { delay = DEFAULT_DELAY, ...rest } = params ?? {}
  return machine.raise(
    {
      type: 'xyflow.setViewport',
      ...rest,
    },
    {
      id: 'fitDiagram',
      delay,
    },
  )
}

export const cancelFitDiagram = () => machine.cancel('fitDiagram')

export const raiseFitDiagram = (params?: { delay?: number; duration?: number; bounds?: BBox }) => {
  const { delay = DEFAULT_DELAY, ...rest } = params ?? {}
  return machine.raise(
    {
      type: 'xyflow.fitDiagram',
      ...rest,
    },
    {
      id: 'fitDiagram',
      delay,
    },
  )
}

export const raiseUpdateView = (view?: DiagramView) =>
  machine.raise(({ context }) => ({
    type: 'update.view',
    view: view ?? context.view,
  }), { delay: DEFAULT_DELAY })

export const assignViewportBefore = (viewport?: Viewport | false) =>
  machine.assign(({ context }) => {
    // Assign to indicate that there is no need to restore viewports
    if (viewport === false) {
      return ({
        viewportBefore: null,
      })
    }
    return {
      // We can assign
      viewportBefore: {
        wasChangedManually: context.viewportChangedManually,
        value: viewport ?? { ...context.viewport },
      },
    }
  })

export const returnViewportBefore = (params?: { delay?: number; duration?: number }) =>
  machine.enqueueActions(({ enqueue, context: { viewportBefore } }) => {
    enqueue(cancelFitDiagram())
    const noDelay = params?.delay === 0
    if (viewportBefore) {
      enqueue.assign({
        viewportChangedManually: viewportBefore.wasChangedManually,
        viewportBefore: null,
      })
      if (noDelay) {
        enqueue(setViewport({ viewport: viewportBefore.value, ...params }))
      } else {
        enqueue(raiseSetViewport({ viewport: viewportBefore.value, ...params }))
      }
    } else {
      if (noDelay) {
        enqueue(fitDiagram({ ...params }))
      } else {
        enqueue(raiseFitDiagram({ ...params }))
      }
    }
  })
