import { Position } from '@xyflow/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { selectLabelRoutes, selectTrackRoutes } from '../../../hooks/useEdgeTracks'
import { type XYStoreState, useXYStore } from '../../../hooks/useXYFlow'
import { useRelationshipEdgePath } from './useRelationshipEdgePath'

vi.mock('../../../hooks/useXYFlow', () => ({ useXYStore: vi.fn<typeof useXYStore>() }))

describe('useRelationshipEdgePath', () => {
  it.each(['forward', 'back'] as const)('matches the selected %s route with offset handles', (dir) => {
    const nodes = ['a', 'b'].map((id, index) => ({
      id,
      type: 'element',
      position: { x: 0, y: index * 300 },
      measured: { width: 100, height: 60 },
      internals: { positionAbsolute: { x: 0, y: index * 300 } },
    }))
    const state = {
      nodes,
      nodeLookup: new Map(nodes.map(node => [node.id, node])),
      edges: ['a-b', 'a-b-2'].map(id => ({
        id,
        type: 'relationship',
        source: 'a',
        target: 'b',
        data: {
          points: [[50, 60], [50, 300]],
          controlPoints: [{ x: 50, y: 180 }],
          dir,
        },
      })),
    } as unknown as XYStoreState
    state.nodeLookup.get('a')!.internals.handleBounds = {
      source: [{ type: 'source', nodeId: 'a', position: Position.Bottom, x: 47, y: 30, width: 6, height: 6 }],
      target: null,
    }
    state.nodeLookup.get('b')!.internals.handleBounds = {
      source: null,
      target: [{ type: 'target', nodeId: 'b', position: Position.Top, x: 47, y: 30, width: 6, height: 6 }],
    }
    vi.mocked(useXYStore).mockImplementation(selector => selector(state))

    const edge = state.edges.find(edge => edge.type === 'relationship')!
    const selected = selectLabelRoutes(state).find(route => route.id === edge.id)!
    const track = selectTrackRoutes(state).get(edge.id)!
    expect(track.movable && track.bounds).toEqual({
      from: { x: 0, y: dir === 'back' ? 300 : 0, width: 100, height: 60 },
      to: { x: 0, y: dir === 'back' ? 0 : 300, width: 100, height: 60 },
    })

    function EdgePath() {
      const path = useRelationshipEdgePath({
        props: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data,
          type: edge.type,
          // ReactFlow reports the side of each handle, rather than its center.
          sourceX: 50,
          sourceY: 36,
          targetX: 50,
          targetY: 330,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          selected: false,
          animated: false,
          selectable: true,
          deletable: true,
        },
        controlPoints: edge.data.controlPoints!,
        isControlPointDragging: false,
        routing: 'ortho',
      })
      expect(path.segments).toEqual(selected.segments)
      return null
    }

    renderToStaticMarkup(createElement(EdgePath))
  })
})
