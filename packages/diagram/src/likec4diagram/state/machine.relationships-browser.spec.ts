// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import type { ReactFlowInstance, ReactFlowState } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { overlaysActorLogic } from '../../overlays/overlaysActor'
import type { RelationshipsBrowserTypes } from '../../overlays/relationships-browser/_types'
import type { Input as RelationshipsBrowserInput } from '../../overlays/relationships-browser/actor'
import { diagramMachine } from './machine'

const mockView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:relationships-browser'),
  title: 'Relationships Browser',
  description: null,
  tags: null,
  links: null,
  hash: 'relationships-browser',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedElementView

type RelationshipsBrowserXYFlowInstance = ReactFlowInstance<
  RelationshipsBrowserTypes.AnyNode,
  RelationshipsBrowserTypes.Edge
>
type RelationshipsBrowserXYStoreApi = {
  getState: () => ReactFlowState<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>
  setState: () => void
  subscribe: () => () => void
}

const mockXYStore = {
  getState: () => ({
    width: 800,
    height: 600,
    transform: [0, 0, 1] as [number, number, number],
    panZoom: undefined,
    panBy: async () => false,
  }),
  setState: () => {},
  subscribe: () => () => {},
} as unknown as RelationshipsBrowserXYStoreApi

const mockXYFlow = {
  getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  setViewport: () => Promise.resolve(true),
  getZoom: () => 1,
  setCenter: () => Promise.resolve(),
  getInternalNode: () => undefined,
  flowToScreenPosition: (pt: { x: number; y: number }) => pt,
  fitView: async () => true,
} as unknown as RelationshipsBrowserXYFlowInstance

function isRelationshipsBrowserOpenEvent(
  event: { type: string },
): event is RelationshipsBrowserInput & { type: 'open.relationshipsBrowser' } {
  return event.type === 'open.relationshipsBrowser'
}

function openRelationshipsBrowser(scope?: 'global' | 'view') {
  const overlays = createActor(
    overlaysActorLogic.provide({
      actors: {
        hotkey: fromCallback(() => () => {}),
      },
    }),
    { input: {} as never },
  )
  overlays.start()
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        mediaPrint: fromCallback(() => () => {}),
        overlays: fromCallback(({ receive }) => {
          receive(event => {
            if (isRelationshipsBrowserOpenEvent(event)) {
              overlays.send(event)
            }
          })
        }) as any,
      },
    }),
    {
      input: {
        view: mockView,
        xystore: mockXYStore as unknown as XYStoreApi,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        relationshipBrowserScope: scope,
        features: {
          ...DefaultFeatures,
          enableRelationshipBrowser: true,
        },
      },
    },
  )
  actor.start()
  actor.send({ type: 'xyflow.init', instance: mockXYFlow as unknown as XYFlowInstance })
  actor.send({
    type: 'update.view',
    view: mockView,
    source: 'external',
    xynodes: [],
    xyedges: [],
  })
  actor.send({ type: 'open.relationshipsBrowser', fqn: scalar.Fqn('system') })

  const browser = overlays.getSnapshot().children['relationshipsBrowser-1']
  expect(browser).toBeDefined()
  if (!browser) {
    throw new Error('Relationships browser actor was not created')
  }
  browser.send({ type: 'xyflow.init', instance: mockXYFlow, store: mockXYStore })
  browser.send({
    type: 'update.view',
    layouted: {
      subject: scalar.Fqn('system'),
      subjectExistsInScope: true,
      nodes: [],
      edges: [],
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    },
  })

  return {
    actor,
    overlays,
    browser,
  }
}

describe('relationship browser scope', () => {
  it('propagates an explicit global scope to the browser actor context', () => {
    const { actor, overlays, browser } = openRelationshipsBrowser('view')

    expect(browser!.getSnapshot().context.scope).toBe('view')
    actor.send({ type: 'open.relationshipsBrowser', fqn: scalar.Fqn('cloud'), scope: 'global' })
    expect(browser!.getSnapshot().context.scope).toBe('global')

    overlays.stop()
    actor.stop()
  })

  it('defaults an omitted scope to view in the browser actor context', () => {
    const { actor, overlays, browser } = openRelationshipsBrowser()

    expect(browser.getSnapshot().context.scope).toBe('view')

    overlays.stop()
    actor.stop()
  })
})
