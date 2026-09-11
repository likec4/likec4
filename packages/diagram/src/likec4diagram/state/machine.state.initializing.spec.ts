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
  it('uses and centers the explicit initial zoom', () => {
    const actor = createTestActor({ fitView: true, initialZoom: 0.75 })
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
})
