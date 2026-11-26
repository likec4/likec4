// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type DiagramEdge, type DiagramNode, type DiagramView, GroupElementKind, scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { diagramToXY } from './diagram-view'

type TestView = Pick<DiagramView, 'id' | 'nodes' | 'edges' | 'bounds' | '_type' | 'autoLayout' | 'routing' | 'edgeEnds'>

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
  it('preserves deployment leaf descriptions without a logical reference', () => {
    const { modelRef: _modelRef, ...deployment } = testNode('prod', {
      deploymentRef: scalar.DeploymentFqn('prod'),
      description: { md: '**Production** environment' },
    })
    const view: TestView = { ...testView([deployment], []), _type: 'deployment' }
    const { xynodes: [node] } = diagramToXY({ view, currentViewId: undefined, where: null })

    expect(node).toMatchObject({
      type: 'deployment',
      data: {
        modelFqn: null,
        deploymentFqn: 'prod',
        description: { md: '**Production** environment' },
      },
    })
  })

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

describe('diagramToXY with corners saved before the ends followed them', () => {
  // 320 x 180 around (560,390); the corner is beside its left side, 40 below the middle
  const element = testNode('element', { x: 400, y: 300, width: 320, height: 180 })
  const far = testNode('far', { x: -400, y: -400, width: 100, height: 100 })
  const edge = testEdge('element-far', element, far, { controlPoints: [{ x: 200, y: 430 }] })
  const controlPointsOf = (view: TestView) =>
    diagramToXY({ view, currentViewId: undefined, where: null }).xyedges[0]?.data.controlPoints

  it('converts the corners of a view with orthogonal routing and no record', () => {
    expect(controlPointsOf({ ...testView([element, far], [edge]), routing: 'ortho' })).toEqual([
      { x: 200, y: 390 },
      { x: 200, y: 430 },
    ])
  })

  it('keeps the corners of a view that records that ends follow the corners', () => {
    expect(controlPointsOf({ ...testView([element, far], [edge]), routing: 'ortho', edgeEnds: 'corner' })).toEqual([
      { x: 200, y: 430 },
    ])
  })

  it('keeps the corners of a view with spline routing', () => {
    expect(controlPointsOf({ ...testView([element, far], [edge]), routing: 'spline' })).toEqual([{ x: 200, y: 430 }])
  })

  it('keeps the corners of a self-loop', () => {
    // both corners face the left side, so converting them would add the bend at (300,390)
    const loop = testEdge('element-element', element, element, {
      controlPoints: [{ x: 300, y: 350 }, { x: 300, y: 430 }],
    })
    expect(controlPointsOf({ ...testView([element], [loop]), routing: 'ortho' })).toEqual([
      { x: 300, y: 350 },
      { x: 300, y: 430 },
    ])
  })
})
