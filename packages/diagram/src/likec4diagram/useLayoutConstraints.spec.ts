import type { NonEmptyArray } from '@likec4/core'
import type { EdgeReplaceChange, InternalNode } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import type { XYStoreApi } from '../hooks'
import type { Types } from './types'
import { createLayoutConstraints } from './useLayoutConstraints'

type Position = { x: number; y: number }

function testNode(id: string, { x, y }: Position): InternalNode<Types.AnyNode> {
  return {
    id,
    position: { x, y },
    measured: { width: 100, height: 100 },
    internals: {
      positionAbsolute: { x, y },
    },
  } as InternalNode<Types.AnyNode>
}

function testEdge(controlPoints: Types.RelationshipEdgeData['controlPoints']): Types.RelationshipEdge {
  return {
    id: 'source-target',
    type: 'relationship',
    source: 'source',
    target: 'target',
    data: {
      points: [
        [50, 50],
        [183, 50],
        [317, 50],
        [450, 50],
      ],
      controlPoints,
    },
  } as unknown as Types.RelationshipEdge
}

function moveSource(
  edge: Types.RelationshipEdge,
  movedPosition: Position = { x: 100, y: 0 },
  sourcePosition: Position = { x: 0, y: 0 },
  targetPosition: Position = { x: 400, y: 0 },
): Types.RelationshipEdge {
  const source = testNode('source', sourcePosition)
  const target = testNode('target', targetPosition)
  const nodeLookup = new Map([
    [source.id, source],
    [target.id, target],
  ])
  const edgeLookup = new Map([[edge.id, edge]])
  let edgeChange: EdgeReplaceChange<Types.AnyEdge> | undefined

  const xyflowApi = {
    getState: () => ({
      parentLookup: new Map(),
      nodeLookup,
      edges: [edge],
      edgeLookup,
      triggerNodeChanges: () => {},
      triggerEdgeChanges: (changes: EdgeReplaceChange<Types.AnyEdge>[]) => {
        edgeChange = changes[0]
      },
    }),
  } as unknown as XYStoreApi

  const constraints = createLayoutConstraints(xyflowApi, ['source'])
  constraints.rects.get('source')!.positionAbsolute = movedPosition
  constraints.updateXYFlow()

  return edgeChange!.item as Types.RelationshipEdge
}

function expectPointInsideNode([x, y]: readonly [number, number], position: Position) {
  expect(x).toBeGreaterThanOrEqual(position.x)
  expect(x).toBeLessThanOrEqual(position.x + 100)
  expect(y).toBeGreaterThanOrEqual(position.y)
  expect(y).toBeLessThanOrEqual(position.y + 100)
}

describe('createLayoutConstraints', () => {
  it('keeps generated edge routing generated when one endpoint crosses the other', () => {
    const movedSource = { x: 600, y: 100 }
    const target = { x: 400, y: 0 }
    const edge = moveSource(testEdge(null), movedSource)
    const sourceHandle = edge.data.points[0]
    const targetHandle = edge.data.points.at(-1)!

    expect(edge.data.controlPoints).toBeNull()
    expectPointInsideNode(sourceHandle, movedSource)
    expectPointInsideNode(targetHandle, target)
    expect(sourceHandle[0]).toBeGreaterThan(targetHandle[0])
    expect(sourceHandle[1]).toBeGreaterThan(targetHandle[1])
  })

  it('keeps generated edge points finite when endpoints overlap', () => {
    const edge = moveSource(
      testEdge(null),
      { x: 100, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    )

    expect(edge.data.controlPoints).toBeNull()
    expect(edge.data.points.flat().every(Number.isFinite)).toBe(true)
  })

  it('moves explicitly authored control points with the endpoint', () => {
    const controlPoints = [
      { x: 200, y: 50 },
      { x: 300, y: 50 },
    ] satisfies NonEmptyArray<{ x: number; y: number }>

    const edge = moveSource(testEdge(controlPoints))

    expect(edge.data.controlPoints).toEqual([
      { x: 262, y: 50 },
      { x: 337, y: 50 },
    ])
    expect(edge.data.points).toEqual(testEdge(controlPoints).data.points)
  })
})
