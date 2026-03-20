import { describe, expect, it, vi } from 'vitest'
import type { XYStoreApi } from '../hooks/useXYFlow'
import { createLayoutConstraints } from './useLayoutConstraints'

/**
 * Minimal mock for InternalNode as expected by createLayoutConstraints
 */
function internalNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opts?: { parentId?: string },
) {
  return {
    id,
    position: { x, y },
    parentId: opts?.parentId,
    selected: false,
    dragging: false,
    internals: {
      positionAbsolute: { x, y },
    },
    measured: { width, height },
    width,
    height,
    initialWidth: width,
    initialHeight: height,
    data: {} as any,
    type: 'element',
  }
}

function createMockStore(nodes: ReturnType<typeof internalNode>[], edges: any[] = []) {
  const nodeLookup = new Map(nodes.map(n => [n.id, n]))
  const parentLookup = new Map<string, Map<string, any>>()
  for (const node of nodes) {
    if (node.parentId) {
      if (!parentLookup.has(node.parentId)) {
        parentLookup.set(node.parentId, new Map())
      }
      parentLookup.get(node.parentId)!.set(node.id, node)
    }
  }
  const edgeLookup = new Map(edges.map((e: any) => [e.id, e]))
  const triggerNodeChanges = vi.fn()
  const triggerEdgeChanges = vi.fn()

  return {
    getState: () => ({
      nodeLookup,
      parentLookup,
      edges,
      edgeLookup,
      triggerNodeChanges,
      triggerEdgeChanges,
    }),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    triggerNodeChanges,
    triggerEdgeChanges,
  } as unknown as XYStoreApi & {
    triggerNodeChanges: ReturnType<typeof vi.fn>
    triggerEdgeChanges: ReturnType<typeof vi.fn>
  }
}

describe('createLayoutConstraints', () => {
  describe('updateXYFlow preserves programmatic position changes', () => {
    it('should apply positions set on rects without resetting from XYFlow state', () => {
      const nodeA = internalNode('a', 0, 0, 100, 50)
      const nodeB = internalNode('b', 200, 100, 100, 50)
      const store = createMockStore([nodeA, nodeB])

      const constraints = createLayoutConstraints(
        store as unknown as XYStoreApi,
        ['a', 'b'],
      )

      // Simulate what layoutAlign does: set aligned positions on rects
      const rectA = constraints.rects.get('a')!
      const rectB = constraints.rects.get('b')!

      // Align both nodes to x=50 (like "Align Left" would do)
      rectA.positionAbsolute = { x: 50, y: 0 }
      rectB.positionAbsolute = { x: 50, y: 100 }

      // Call updateXYFlow - this should use the rect positions we just set,
      // NOT reset them from node.internals.positionAbsolute
      constraints.updateXYFlow()

      const { triggerNodeChanges } = store
      expect(triggerNodeChanges).toHaveBeenCalledOnce()

      const nodeChanges = triggerNodeChanges.mock.calls[0]![0]
      const positionChanges = nodeChanges.filter((c: any) => c.type === 'position')

      const changeA = positionChanges.find((c: any) => c.id === 'a')
      const changeB = positionChanges.find((c: any) => c.id === 'b')

      expect(changeA).toBeDefined()
      expect(changeB).toBeDefined()
      expect(changeA.positionAbsolute).toEqual({ x: 50, y: 0 })
      expect(changeB.positionAbsolute).toEqual({ x: 50, y: 100 })
    })

    it('should detect changes after programmatic position update', () => {
      const nodeA = internalNode('a', 0, 0, 100, 50)
      const nodeB = internalNode('b', 200, 100, 100, 50)
      const store = createMockStore([nodeA, nodeB])

      const constraints = createLayoutConstraints(
        store as unknown as XYStoreApi,
        ['a', 'b'],
      )

      // Before any changes
      expect(constraints.hasChanges()).toBe(false)

      // Simulate alignment
      constraints.rects.get('a')!.positionAbsolute = { x: 50, y: 0 }
      constraints.rects.get('b')!.positionAbsolute = { x: 50, y: 100 }

      expect(constraints.hasChanges()).toBe(true)
    })
  })

  describe('rects initialization', () => {
    it('should create rects for all editing nodes', () => {
      const nodeA = internalNode('a', 10, 20, 100, 50)
      const nodeB = internalNode('b', 200, 80, 120, 60)
      const store = createMockStore([nodeA, nodeB])

      const constraints = createLayoutConstraints(
        store as unknown as XYStoreApi,
        ['a', 'b'],
      )

      expect(constraints.rects.size).toBe(2)
      expect(constraints.rects.get('a')).toBeDefined()
      expect(constraints.rects.get('b')).toBeDefined()

      expect(constraints.rects.get('a')!.positionAbsolute).toEqual({ x: 10, y: 20 })
      expect(constraints.rects.get('b')!.positionAbsolute).toEqual({ x: 200, y: 80 })
    })
  })
})
