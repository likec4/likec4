// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
import {
  BBox,
  invariant,
  nonNullable,
} from '@likec4/core'
import type {
  XYPoint,
} from '@likec4/core/types'
import type { Viewport } from '@xyflow/react'
import {
  getViewportForBounds,
} from '@xyflow/react'
import {
  assertEvent,
} from 'xstate'
import { MinZoom } from '../../base'
import { machine } from './machine.setup'
import {
  activeSequenceBounds,
  focusedBounds,
} from './utils'

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
    duration = duration ?? 400
    const { panZoom } = nonNullable(context.xystore).getState()
    const animationProps = duration > 0 ? { duration, interpolate: 'smooth' as const } : undefined
    panZoom?.setViewport(viewport, animationProps).catch((err) => {
      console.error('Error during fitDiagram panZoom setViewport', { err })
    })
  })

export const setViewportCenter = (params?: { x: number; y: number }) =>
  machine.createAction(({ context, event }) => {
    let center: XYPoint
    if (params) {
      center = params
    } else if (event.type === 'update.view') {
      center = BBox.center(event.view.bounds)
    } else {
      center = BBox.center(context.view.bounds)
    }
    invariant(context.xyflow, 'xyflow is not initialized')
    const zoom = context.xyflow.getZoom()
    context.xyflow.setCenter(Math.round(center.x), Math.round(center.y), { zoom })
  })

export const fitDiagram = (params?: { duration?: number; bounds?: BBox }) =>
  machine.enqueueActions(({ context, event, enqueue }) => {
    let bounds = context.view.bounds, duration: number | undefined
    if (params) {
      bounds = params.bounds ?? context.view.bounds
      duration = params.duration
    } else if (event.type === 'xyflow.fitDiagram') {
      bounds = event.bounds ?? context.view.bounds
      duration = event.duration
      enqueue.assign({
        viewportChangedManually: false,
      })
    }
    // Default values
    duration ??= 450

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
    panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined).catch((err) => {
      console.error('Error during fitDiagram panZoom setViewport', { err })
    })
  })

export const fitFocusedBounds = () =>
  machine.createAction(({ context }) => {
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

export const assignViewportBefore = (viewport?: Viewport | null) =>
  machine.assign(({ context }) => {
    // Assign null to indicate that there is no need to restore viewports
    if (viewport === null) {
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
    if (viewportBefore) {
      enqueue.assign({
        viewportChangedManually: viewportBefore.wasChangedManually,
        viewportBefore: null,
      })
      if (params && params.delay === 0) {
        enqueue(setViewport({ viewport: viewportBefore.value, ...params }))
      } else {
        enqueue(raiseSetViewport({ viewport: viewportBefore.value, ...params }))
      }
    } else {
      if (params && params.delay === 0) {
        enqueue(fitDiagram({ ...params }))
      } else {
        enqueue(raiseFitDiagram({ ...params }))
      }
    }
  })
