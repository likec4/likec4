import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import { describe, it } from 'vitest'
import { layoutedProjectsViewToXYFlow } from './layouted-to-xyflow'

describe('layoutedProjectsViewToXYFlow', () => {
  it('places a project inside its group and routes edges orthogonally', ({ expect }) => {
    const view = {
      routing: 'ortho',
      nodes: [
        {
          id: 'g',
          kind: '@group',
          parent: null,
          title: 'payments',
          color: 'gray',
          depth: 1,
          style: { border: 'dashed', opacity: 15 },
          x: 10,
          y: 20,
          width: 200,
          height: 180,
          children: ['p'],
        },
        {
          id: 'p',
          kind: '@project',
          projectId: 'api',
          parent: 'g',
          title: 'api',
          color: 'green',
          x: 30,
          y: 50,
          width: 80,
          height: 40,
          children: [],
        },
      ],
      edges: [
        {
          id: 'e',
          source: 'p',
          target: 'p',
          points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
          color: 'gray',
          line: 'solid',
          label: null,
          labelBBox: null,
          projectId: 'api',
        },
      ],
    } as unknown as LayoutedProjectsView

    const { xynodes, xyedges } = layoutedProjectsViewToXYFlow(view)
    expect(xynodes.map(node => [node.type, node.position, node.parentId ?? null])).toEqual([
      ['project-group', { x: 10, y: 20 }, null],
      ['project', { x: 20, y: 30 }, 'g'],
    ])
    expect(xyedges[0]?.data.routing).toBe('ortho')
  })
})
