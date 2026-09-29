// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'
import { viewBounds } from './utils'

const viewportSize = { width: 1000, height: 800 }

const view = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:initializing'),
  title: 'Initial viewport',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 100, y: 200, width: 1800, height: 1000 },
} satisfies LayoutedElementView

const viewBoundsCenter = (currentView: LayoutedElementView) => ({
  x: currentView.bounds.x + currentView.bounds.width / 2,
  y: currentView.bounds.y + currentView.bounds.height / 2,
})

const viewportCenter = (
  viewport: { x: number; y: number; zoom: number },
  size: typeof viewportSize,
) => ({
  x: (size.width / 2 - viewport.x) / viewport.zoom,
  y: (size.height / 2 - viewport.y) / viewport.zoom,
})

function createTestActor({ fitView, initialZoom }: { fitView: boolean; initialZoom?: number }) {
  let initialViewport: { x: number; y: number; zoom: number } | undefined

  const xystore = {
    getState: () => ({
      ...viewportSize,
      transform: [0, 0, 1] as [number, number, number],
      panZoom: {
        setViewport: (nextViewport: { x: number; y: number; zoom: number }) => {
          initialViewport = nextViewport
          return Promise.resolve(true)
        },
      },
    }),
    setState: () => {},
    subscribe: () => () => {},
  } as unknown as XYStoreApi

  const xyflow = {
    getViewport: () => initialViewport ?? { x: 0, y: 0, zoom: 1 },
  } as unknown as XYFlowInstance

  const actor = createActor(
    diagramMachine.provide({
      actors: {
        mediaPrint: fromCallback(() => () => {}),
      },
    }),
    {
      input: {
        view,
        xystore,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        features: DefaultFeatures,
        fitView,
        initialZoom,
      },
    },
  )
  actor.start()
  actor.send({ type: 'xyflow.init', instance: xyflow })
  actor.send({ type: 'update.view', view, source: 'external', xynodes: [], xyedges: [] })
  actor.send({ type: 'xyflow.viewportMoved', viewport: initialViewport!, manually: false })

  return actor
}

describe('initializing state', () => {
  it('uses and centers the explicit initial zoom when fit is disabled', () => {
    const actor = createTestActor({ fitView: false, initialZoom: 0.75 })
    const snapshot = actor.getSnapshot()

    expect(snapshot.context.viewport.zoom).toBe(0.75)
    expect(viewportCenter(snapshot.context.viewport, viewportSize)).toEqual(viewBoundsCenter(view))

    actor.stop()
  })

  it('uses fit-derived zoom when fitView is enabled without an explicit zoom', () => {
    const actor = createTestActor({ fitView: true })
    const snapshot = actor.getSnapshot()

    expect(snapshot.context.viewport.zoom).toBeCloseTo(viewportSize.width / view.bounds.width)

    actor.stop()
  })

  it('uses centered zoom 1 when fitView is disabled without an explicit zoom', () => {
    const actor = createTestActor({ fitView: false })
    const snapshot = actor.getSnapshot()

    expect(snapshot.context.viewport.zoom).toBe(1)
    expect(viewportCenter(snapshot.context.viewport, viewportSize)).toEqual(viewBoundsCenter(view))

    actor.stop()
  })

  it('fits measured note bounds and ignores bounds from another view', () => {
    const actor = createTestActor({ fitView: true })
    actor.send({ type: 'update.features', features: { ...DefaultFeatures, enableFitView: true, enableNotes: true } })
    actor.send({
      type: 'notes.bounds',
      viewId: view.id,
      bounds: { x: 1900, y: 250, width: 320, height: 180 },
    })

    expect(viewBounds(actor.getSnapshot().context)).toEqual({ x: 100, y: 200, width: 2120, height: 1000 })
    const fitted = actor.getSnapshot().context.xyflow!.getViewport()
    expect(Math.abs(viewportCenter(fitted, viewportSize).x - 1160)).toBeLessThan(3)

    actor.send({
      type: 'notes.bounds',
      viewId: scalar.ViewId('view:other'),
      bounds: { x: -500, y: -500, width: 100, height: 100 },
    })
    expect(viewBounds(actor.getSnapshot().context).x).toBe(100)

    actor.send({ type: 'update.features', features: { ...DefaultFeatures, enableFitView: true, enableNotes: false } })
    expect(viewBounds(actor.getSnapshot().context)).toEqual(view.bounds)
    actor.stop()
  })

  it('keeps the explicit fit action available when automatic fit is disabled', () => {
    const actor = createTestActor({ fitView: false })
    expect(actor.getSnapshot().context.xyflow!.getViewport().zoom).toBe(1)
    actor.send({ type: 'xyflow.fitDiagram' })
    expect(actor.getSnapshot().context.xyflow!.getViewport().zoom).toBeLessThan(1)
    actor.stop()
  })

  it('does not auto-fit new note bounds after the user moves the viewport', () => {
    const actor = createTestActor({ fitView: true })
    actor.send({ type: 'update.features', features: { ...DefaultFeatures, enableFitView: true, enableNotes: true } })
    const before = actor.getSnapshot().context.xyflow!.getViewport()
    actor.send({ type: 'xyflow.viewportMoved', viewport: before, manually: true })
    actor.send({
      type: 'notes.bounds',
      viewId: view.id,
      bounds: { x: 1900, y: 250, width: 320, height: 180 },
    })
    expect(viewBounds(actor.getSnapshot().context).width).toBe(2120)
    expect(actor.getSnapshot().context.xyflow!.getViewport()).toEqual(before)
    actor.stop()
  })
})
