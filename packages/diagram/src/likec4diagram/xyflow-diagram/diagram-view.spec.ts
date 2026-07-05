// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type DiagramEdge, type DiagramNode, type DiagramView, GroupElementKind, scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { diagramToXY } from './diagram-view'

type TestView = Pick<DiagramView, 'id' | 'nodes' | 'edges' | 'bounds' | '_type' | 'autoLayout'>

function testNode(id: string, overrides: Partial<DiagramNode> = {}): DiagramNode {
  const nodeId = scalar.NodeId(id)
  const node: DiagramNode = {
    id: nodeId,
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    labelBBox: { x: 0, y: 0, width: 100, height: 24 },
    kind: 'component',
    modelRef: scalar.Fqn(id),
    title: id,
    description: null,
    technology: null,
    color: 'primary',
    shape: 'rectangle',
    style: {},
    level: 0,
    tags: [],
    ...overrides,
  }
  if (node.kind === GroupElementKind) {
    const { modelRef: _modelRef, deploymentRef: _deploymentRef, ...groupNode } = node
    return groupNode
  }
  return node
}

function testEdge(
  id: string,
  source: DiagramNode,
  target: DiagramNode,
  overrides: Partial<DiagramEdge> = {},
): DiagramEdge {
  return {
    id: scalar.EdgeId(id),
    parent: null,
    source: source.id,
    target: target.id,
    label: null,
    technology: null,
    relations: [],
    color: 'primary',
    line: 'solid',
    points: [
      [0, 0],
      [100, 100],
    ],
    ...overrides,
  }
}

function testView(nodes: DiagramNode[], edges: DiagramEdge[]): TestView {
  return {
    _type: 'element',
    id: scalar.ViewId('index'),
    autoLayout: { direction: 'TB' },
    bounds: { x: 0, y: 0, width: 1000, height: 1000 },
    nodes,
    edges,
  }
}

describe('diagramToXY accessibility', () => {
  it('adds screen-reader labels to element nodes and relationship edges', () => {
    const customer = testNode('customer', {
      title: 'Customer',
      kind: 'actor',
      technology: 'Browser',
      description: { txt: 'Places orders' },
      navigateTo: scalar.ViewId('customer'),
    })
    const web = testNode('web', {
      title: 'Web Application',
      technology: 'React',
    })
    const relationship = testEdge('customer-web', customer, web, {
      label: 'uses',
      technology: 'HTTPS',
      notes: { txt: 'Authenticated traffic' },
      navigateTo: scalar.ViewId('customer-web'),
    })

    const { xynodes, xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'customer')?.ariaLabel).toBe(
      'Customer. Node kind: actor. Technology: Browser. Description: Places orders. Opens view customer.',
    )
    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from Customer to Web Application. Label: uses. Technology: HTTPS. Notes: Authenticated traffic. Opens view customer-web.',
    )
  })

  it('uses readable plain text in screen-reader labels', () => {
    const customer = testNode('customer', {
      title: '',
      description: { md: '**Places orders** with [checkout](https://example.com)' },
    })
    const web = testNode('web', {
      title: 'Web Application',
    })
    const relationship = testEdge('customer-web', customer, web, {
      notes: { md: '**Authenticated** traffic with [OAuth](https://example.com)' },
    })

    const { xynodes, xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'customer')?.ariaLabel).toBe(
      'customer. Node kind: component. Description: Places orders with checkout.',
    )
    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from customer to Web Application. Notes: Authenticated traffic with OAuth.',
    )
  })

  it('labels relationship descriptions and notes separately', () => {
    const customer = testNode('customer', {
      title: 'Customer',
    })
    const web = testNode('web', {
      title: 'Web Application',
    })
    const relationship = testEdge('customer-web', customer, web, {
      description: { txt: 'Uses checkout' },
      notes: { txt: 'Reviewed by architecture' },
    })

    const { xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from Customer to Web Application. Description: Uses checkout. Notes: Reviewed by architecture.',
    )
  })

  it('adds screen-reader labels to view groups', () => {
    const child = testNode('web', {
      parent: scalar.NodeId('group'),
      title: 'Web Application',
    })
    const group = testNode('group', {
      kind: GroupElementKind,
      title: 'Checkout',
      children: [child.id],
      notes: { txt: 'Important boundary' },
    })

    const { xynodes } = diagramToXY({
      view: testView([group, child], []),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'group')?.ariaLabel).toBe(
      'Checkout. Group. Contains 1 node. Notes: Important boundary.',
    )
  })
})
