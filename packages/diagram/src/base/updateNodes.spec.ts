import { type NodeHandle, Position } from '@xyflow/system'
import { describe, expect, it } from 'vitest'
import type { BaseNode } from './types'
import { updateNodes } from './updateNodes'

type TestNode = BaseNode<{
  label: string
  extra?: string
}>

function createNode(
  id: string,
  overrides: Partial<TestNode> = {},
): TestNode {
  return {
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    initialWidth: 100,
    initialHeight: 50,
    data: {
      label: id,
    },
    ...overrides,
  }
}

describe('updateNodes', () => {
  describe('basic updates', () => {
    it('returns same array when nodes are equal', () => {
      const current = [
        createNode('node1'),
        createNode('node2'),
      ]
      const update = [
        createNode('node1'),
        createNode('node2'),
      ]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
    })

    it('adds new nodes that do not exist', () => {
      const current = [createNode('node1')]
      const update = [
        createNode('node1'),
        createNode('node2'),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result).toHaveLength(2)
      // Preserves existing node
      expect(result[0]).toBe(current[0])
      // Adds new node
      expect(result[1]).toBe(update[1])
    })

    it('returns new array when node is removed', () => {
      const current = [
        createNode('node1'),
        createNode('node2'),
      ]
      const update = [createNode('node1')]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result).toHaveLength(1)
      // Preserves existing node
      expect(result[0]).toBe(current[0])
    })

    it('replaces node when type changes', () => {
      const current = [createNode('node1', { type: 'type1' })]
      const update = [createNode('node1', { type: 'type2' })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).toBe(update[0])
    })
  })

  describe('position updates', () => {
    it('updates node position', () => {
      const current = [createNode('node1', { position: { x: 0, y: 0 } })]
      const update = [createNode('node1', { position: { x: 100, y: 50 } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.position).toEqual({ x: 100, y: 50 })
    })

    it('preserves existing node when position is the same', () => {
      const current = [createNode('node1', { position: { x: 100, y: 50 } })]
      const update = [createNode('node1', { position: { x: 100, y: 50 } })]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })
  })

  describe('dimension updates', () => {
    it('updates node dimensions', () => {
      const current = [
        createNode('node1', {
          initialWidth: 100,
          initialHeight: 50,
          measured: { width: 100, height: 50 },
        }),
      ]
      const update = [
        createNode('node1', { initialWidth: 200, initialHeight: 100 }),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.initialWidth).toBe(200)
      expect(result[0]?.initialHeight).toBe(100)
      expect(result[0]?.measured).toEqual({ width: 200, height: 100 })
      expect(result[0]?.width).toBe(200)
      expect(result[0]?.height).toBe(100)
    })

    it('preserves existing node when dimensions are the same', () => {
      const current = [
        createNode('node1', {
          initialWidth: 100,
          initialHeight: 50,
          measured: { width: 100, height: 50 },
          width: 100,
          height: 50,
        }),
      ]
      const update = [
        createNode('node1', { initialWidth: 100, initialHeight: 50 }),
      ]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })
  })

  describe('data updates', () => {
    it('updates node data when changed', () => {
      const current = [createNode('node1', { data: { label: 'old' } })]
      const update = [createNode('node1', { data: { label: 'new' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.data).toBe(update[0]?.data)
    })

    it('preserves existing node when data is a superset', () => {
      const existingData = { label: 'node1', extra: 'data' }
      const current = [createNode('node1', { data: existingData })]
      const update = [createNode('node1', { data: { label: 'node1' } })]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })

    it('preserves existing data object when data is a superset, but node has other changes', () => {
      const existingData = { label: 'label1', extra: 'data', hovered: true }
      const current = [createNode('node1', { data: existingData })]
      const update = [createNode('node1', { initialWidth: 32, data: { label: 'label1' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0]) // because dimensions changed
      expect(result[0]?.data).toBe(existingData)
    })

    it('updates when existing data is not a superset of new data', () => {
      const current = [createNode('node1', { data: { label: 'node1' } })]
      const update = [
        createNode('node1', { data: { label: 'node1', dimmed: 'immediate' } }),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0]) // because data changed
      expect(result[0]?.data).toBe(update[0]!.data)
    })

    it('preserves hovered state when data changes but hovered is not in update', () => {
      const current = [createNode('node1', { data: { label: 'old', hovered: true } })]
      const update = [createNode('node1', { data: { label: 'new' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.data).not.toBe(current[0]?.data)
      expect(result[0]?.data).not.toBe(update[0]?.data)
      expect(result[0]?.data).toEqual({ label: 'new', hovered: true })
    })

    it('preserves dimmed state when data changes but dimmed is not in update', () => {
      const current = [createNode('node1', { data: { label: 'old', dimmed: 'immediate' } })]
      const update = [createNode('node1', { data: { label: 'new' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.data).toEqual({ label: 'new', dimmed: 'immediate' })
    })

    it('preserves both hovered and dimmed states when data changes', () => {
      const current = [createNode('node1', {
        data: { label: 'old', hovered: true, dimmed: true },
      })]
      const update = [createNode('node1', { data: { label: 'new' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.data).toEqual({ label: 'new', hovered: true, dimmed: true })
    })

    it('does not preserve hovered state when explicitly set to false in update', () => {
      const current = [createNode('node1', { data: { label: 'old', hovered: true } })]
      const update = [createNode('node1', { data: { label: 'new', hovered: false } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.data).toBe(update[0]?.data)
      expect(result[0]?.data.hovered).toBe(false)
    })

    it('does not preserve dimmed state when explicitly set in update', () => {
      const current = [createNode('node1', { data: { label: 'old', dimmed: 'immediate' } })]
      const update = [createNode('node1', { data: { label: 'new', dimmed: true } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]?.data).toBe(update[0]?.data)
      expect(result[0]?.data.dimmed).toBe(true)
    })
  })

  describe('parent updates', () => {
    it('updates parentId', () => {
      const current = [createNode('node1')]
      const update = [createNode('node1', { parentId: 'parent1' })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.parentId).toBe('parent1')
    })

    it('removes parentId when changed to undefined', () => {
      const current = [createNode('node1', { parentId: 'parent1' })]
      const update = [createNode('node1')]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.parentId).toBeUndefined()
    })

    it('preserves existing node when parentId is the same', () => {
      const current = [createNode('node1', { parentId: 'parent1' })]
      const update = [createNode('node1', { parentId: 'parent1' })]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })
  })

  describe('measured dimensions', () => {
    it('does not assign measured property, if was not present in existing', () => {
      const current = [
        createNode('node1', {
          initialWidth: 100,
          initialHeight: 50,
        }),
      ]
      const update = [
        createNode('node1', {
          initialWidth: 200,
          initialHeight: 100,
        }),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]).not.toBe(update[0])
      expect(result[0]).not.toHaveProperty('measured')
      // Width and height are now forced in the implementation
      expect(result[0]?.width).toBe(200)
      expect(result[0]?.height).toBe(100)
    })

    it('forces dimensions from update in measured property', () => {
      const current = [
        createNode('node1', {
          initialWidth: 100,
          initialHeight: 50,
          measured: { width: 120, height: 60 },
        }),
      ]
      const update = [
        createNode('node1', {
          // should pick up these dimensions
          width: 200,
          height: 100,
          // Should be ignored
          initialWidth: 100,
          initialHeight: 50,
          position: { x: 0, y: 0 },
        }),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.position).toEqual(update[0]?.position)
      expect(result[0]?.measured).toEqual({ width: 200, height: 100 })
      expect(result[0]?.width).toBe(200)
      expect(result[0]?.height).toBe(100)
    })
  })

  describe('property updates', () => {
    it('updates className property', () => {
      const current = [createNode('node1', { className: 'old-class' })]
      const update = [createNode('node1', { className: 'new-class' })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.className).toBe('new-class')
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates hidden property', () => {
      const current = [createNode('node1')]
      const update = [createNode('node1', { hidden: true })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.hidden).toBe(true)
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates selected property', () => {
      const current = [createNode('node1')]
      const update = [createNode('node1', { selected: true })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.selected).toBe(true)
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates selectable property', () => {
      const current = [createNode('node1', { selectable: true })]
      const update = [createNode('node1', { selectable: false })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.selectable).toBe(false)
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates style property', () => {
      const current = [createNode('node1')]
      const update = [createNode('node1', { style: { color: 'red' } })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.style).toEqual({ color: 'red' })
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates zIndex property', () => {
      const current = [createNode('node1', { zIndex: 1 })]
      const update = [createNode('node1', { zIndex: 10 })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.zIndex).toBe(10)
      // preserves existing node data
      expect(result[0]?.data).toBe(current[0]?.data)
    })

    it('updates handles', () => {
      const handles = {
        current: [{ id: 'handle1', type: 'source', position: Position.Left }],
        update: [{ id: 'handle1', type: 'source', position: Position.Right }],
      } as {
        current: NodeHandle[]
        update: NodeHandle[]
      }
      const current = [createNode('node1', { handles: handles.current })]
      const update = [createNode('node1', { handles: handles.update })]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]?.handles).toBe(handles.update)
    })

    it('preserves node when handles are equal', () => {
      const handles = [{ id: 'handle1', type: 'source', position: Position.Left }] as NodeHandle[]
      const current = [createNode('node1', { handles })]
      const update = [createNode('node1', { handles: structuredClone(handles) })]

      // just to be sure that objects are different
      expect(update[0]?.handles).not.toBe(current[0]?.handles)

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })

    it('preserves handles when equal, but node has changes', () => {
      const handles = [{ id: 'handle1', type: 'source', position: Position.Left }] as NodeHandle[]
      const current = [createNode('node1', { handles })]
      const update = [createNode('node1', { handles: structuredClone(handles), selected: true })]

      // just to be sure that
      expect(update[0]?.handles).not.toBe(current[0]?.handles)

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).not.toBe(current[0])
      expect(result[0]).not.toBe(update[0])
      expect(result[0]?.handles).toBe(current[0]?.handles)
      expect(result[0]?.selected).toBe(true)
      // Width and height are now forced in the implementation
      expect(result[0]?.width).toBe(100)
      expect(result[0]?.height).toBe(50)
    })
  })

  describe('multiple node updates', () => {
    it('updates only changed nodes', () => {
      const current = [
        createNode('node1'),
        createNode('node2'),
        createNode('node3'),
      ]
      const update = [
        createNode('node1'), // no change
        createNode('node2', { position: { x: 100, y: 50 } }), // position changed
        createNode('node3'), // no change
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).toBe(current[0])
      expect(result[1]).not.toBe(current[1])
      expect(result[1]?.position).toEqual({ x: 100, y: 50 })
      expect(result[2]).toBe(current[2])
    })

    it('handles node reordering', () => {
      const current = [
        createNode('node1'),
        createNode('node2'),
      ]
      const update = [
        createNode('node2'),
        createNode('node1'),
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result[0]).toBe(current[1])
      expect(result[1]).toBe(current[0])
    })

    it('handles complex changes', () => {
      const current = [
        createNode('node1', { position: { x: 0, y: 0 } }),
        createNode('node2', { position: { x: 100, y: 0 } }),
        createNode('node3', { position: { x: 200, y: 0 } }),
      ]
      const update = [
        createNode('node1', { position: { x: 0, y: 0 } }), // no change
        createNode('node2', { position: { x: 150, y: 50 } }), // position changed
        // node3 removed
        createNode('node4', { position: { x: 300, y: 0 } }), // new node
      ]

      const result = updateNodes(current, update)

      expect(result).not.toBe(current)
      expect(result).toHaveLength(3)
      expect(result[0]).toBe(current[0])
      expect(result[1]?.position).toEqual({ x: 150, y: 50 })
      expect(result[2]?.id).toBe('node4')
    })
  })

  describe('edge cases', () => {
    it('handles empty arrays', () => {
      const result = updateNodes([], [])
      expect(result).toEqual([])
    })

    it('handles empty current with new nodes', () => {
      const update = [createNode('node1')]
      const result = updateNodes([], update)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(update[0])
    })

    it('handles empty update with existing nodes', () => {
      const current = [createNode('node1')]
      const result = updateNodes(current, [])

      expect(result).not.toBe(current)
      expect(result).toHaveLength(0)
    })

    it('preserves other node properties not explicitly checked', () => {
      const current = [
        createNode('node1', {
          connectable: false,
          deletable: true,
        }),
      ]
      const update = [createNode('node1', {
        connectable: true,
        deletable: false,
      })]

      const result = updateNodes(current, update)

      expect(result).toBe(current)
      expect(result[0]).toBe(current[0])
    })
  })
})
