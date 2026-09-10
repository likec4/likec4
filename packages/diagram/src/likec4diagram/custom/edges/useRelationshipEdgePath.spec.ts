import type { XYPosition } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  NodeConnectionBoundaryResolver,
} from '../../../context/NodeConnectionBoundary'
import type { Types } from '../../types'
import {
  resolveControlPointRoute,
  resolveNodeConnectionPoint,
  resolvePersistedPathEndpoints,
} from './relationshipEdgePath'

const sourceBounds = { x: 0, y: 0, width: 100, height: 100 }
const targetBounds = { x: 200, y: 0, width: 100, height: 100 }

const forwardPoints = [
  [100, 50],
  [130, 50],
  [170, 50],
  [200, 50],
] as Types.RelationshipEdgeData['points']

const boundaryResolver: NodeConnectionBoundaryResolver = ({ end }) =>
  end === 'source' ? { x: 90, y: 40 } : { x: 210, y: 60 }

describe('resolveNodeConnectionPoint', () => {
  it('returns a finite custom boundary point', () => {
    expect(resolveNodeConnectionPoint(
      boundaryResolver,
      'source',
      sourceBounds,
      { x: 200, y: 50 },
      'source',
    )).toEqual({ x: 90, y: 40 })
  })

  it.each([
    undefined,
    null,
    { x: Number.NaN, y: 0 },
    { x: 0, y: Number.POSITIVE_INFINITY },
  ])('falls back for an unusable resolver result: %j', (result) => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(() => result)
    expect(resolveNodeConnectionPoint(
      resolver,
      'source',
      sourceBounds,
      { x: 200, y: 50 },
      'source',
    )).toBeNull()
  })
})

describe('resolvePersistedPathEndpoints', () => {
  it('preserves the existing path when no custom boundary is resolved', () => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(() => undefined)
    const resolved = resolvePersistedPathEndpoints(
      forwardPoints,
      resolver,
      'source',
      sourceBounds,
      'target',
      targetBounds,
      'forward',
    )

    expect(resolved).toBe(forwardPoints)
  })

  it('moves forward endpoints and adjacent controls together', () => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(boundaryResolver)
    const resolved = resolvePersistedPathEndpoints(
      forwardPoints,
      resolver,
      'source',
      sourceBounds,
      'target',
      targetBounds,
      'forward',
    )

    expect(resolved).toEqual([
      [90, 40],
      [120, 40],
      [180, 60],
      [210, 60],
    ])
    expect(resolver).toHaveBeenNthCalledWith(1, {
      nodeId: 'source',
      nodeBounds: sourceBounds,
      toward: { x: 130, y: 50 },
      end: 'source',
    })
    expect(resolver).toHaveBeenNthCalledWith(2, {
      nodeId: 'target',
      nodeBounds: targetBounds,
      toward: { x: 170, y: 50 },
      end: 'target',
    })
  })

  it('maps source and target to the correct ends of a backward path', () => {
    const backwardPoints = [...forwardPoints].reverse() as Types.RelationshipEdgeData['points']
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(boundaryResolver)
    const resolved = resolvePersistedPathEndpoints(
      backwardPoints,
      resolver,
      'source',
      sourceBounds,
      'target',
      targetBounds,
      'back',
    )

    expect(resolved).toEqual([
      [210, 60],
      [180, 60],
      [120, 40],
      [90, 40],
    ])
    expect(resolver.mock.calls.map(([request]) => request.end)).toEqual(['source', 'target'])
  })
})

describe('resolveControlPointRoute', () => {
  const sourceCenter: XYPosition = { x: 50, y: 50 }
  const targetCenter: XYPosition = { x: 250, y: 50 }

  it('uses custom boundaries while editing a forward route', () => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(boundaryResolver)
    const route = resolveControlPointRoute({
      resolver,
      sourceId: 'source',
      sourceBounds,
      sourceCenter,
      targetId: 'target',
      targetBounds,
      targetCenter,
      controlPoints: [{ x: 125, y: 20 }, { x: 175, y: 80 }],
      direction: 'forward',
    })

    expect(route).toEqual([
      sourceCenter,
      { x: 90, y: 40 },
      { x: 125, y: 20 },
      { x: 175, y: 80 },
      { x: 210, y: 60 },
      targetCenter,
    ])
    expect(resolver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        nodeId: 'source',
        toward: { x: 125, y: 20 },
        end: 'source',
      }),
    )
    expect(resolver).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        nodeId: 'target',
        toward: { x: 175, y: 80 },
        end: 'target',
      }),
    )
  })

  it('uses the route points adjacent to each node for a backward route', () => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(boundaryResolver)
    resolveControlPointRoute({
      resolver,
      sourceId: 'source',
      sourceBounds,
      sourceCenter,
      targetId: 'target',
      targetBounds,
      targetCenter,
      controlPoints: [{ x: 175, y: 20 }, { x: 125, y: 80 }],
      direction: 'back',
    })

    expect(resolver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        nodeId: 'source',
        toward: { x: 125, y: 80 },
        end: 'source',
      }),
    )
    expect(resolver).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        nodeId: 'target',
        toward: { x: 175, y: 20 },
        end: 'target',
      }),
    )
  })

  it('uses the standard rectangular boundary when the resolver opts out', () => {
    const route = resolveControlPointRoute({
      resolver: () => undefined,
      sourceId: 'source',
      sourceBounds,
      sourceCenter,
      targetId: 'target',
      targetBounds,
      targetCenter,
      controlPoints: [{ x: 150, y: 50 }],
      direction: 'forward',
    })

    expect(route).toEqual([
      sourceCenter,
      { x: 106, y: 50 },
      { x: 150, y: 50 },
      { x: 194, y: 50 },
      targetCenter,
    ])
  })

  it('passes exact measured bounds while preserving the existing fallback geometry', () => {
    const resolver = vi.fn<NodeConnectionBoundaryResolver>(() => undefined)
    const measuredSourceBounds = { x: 0.25, y: 0.5, width: 99.5, height: 100.25 }
    const route = resolveControlPointRoute({
      resolver,
      sourceId: 'source',
      sourceBounds: measuredSourceBounds,
      sourceDefaultBounds: sourceBounds,
      sourceCenter,
      targetId: 'target',
      targetBounds,
      targetCenter,
      controlPoints: [{ x: 150, y: 50 }],
      direction: 'forward',
    })

    expect(resolver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        nodeBounds: measuredSourceBounds,
      }),
    )
    expect(route[1]).toEqual({ x: 106, y: 50 })
  })
})
