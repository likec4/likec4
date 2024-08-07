import { describe, expect, it } from 'vitest'
import { $include } from '../../compute-view/__test__/fixture'
import { $step, compute } from './fixture'

const defaultStepProps = {
  color: 'gray',
  head: 'normal',
  line: 'dashed'
}

describe('dynamic-view', () => {
  it('should include nodes and edges from steps', () => {
    const { nodeIds, edgeIds, edges } = compute([
      $step('customer -> cloud.frontend.dashboard', 'open dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      $step('cloud.frontend.dashboard <- cloud.backend.graphql', 'return data')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql'
    ])
    expect(edgeIds).toEqual([
      'step-001',
      'step-002',
      'step-003'
    ])
    expect(edges).toMatchObject([
      {
        id: 'step-001',
        source: 'customer',
        target: 'cloud.frontend.dashboard',
        label: 'open dashboard'
      },
      {
        id: 'step-002',
        source: 'cloud.frontend.dashboard',
        target: 'cloud.backend.graphql',
        label: 'requests' // inferred from relations
      },
      {
        id: 'step-003',
        source: 'cloud.backend.graphql',
        target: 'cloud.frontend.dashboard',
        dir: 'back',
        label: 'return data'
      }
    ])
    expect([edges[0], edges[1]]).have.not.a.property('dir')
  })

  it('should build compounds', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('customer -> cloud.frontend.dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      $step('cloud.backend -> amazon'),
      $step('cloud.backend <- amazon'),
      $step('cloud.frontend <- cloud.backend', {
        line: 'dotted',
        color: 'red'
      })
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'cloud.backend',
      'amazon',
      'cloud.frontend'
    ])
    expect(edgeIds).toEqual([
      'step-001',
      'step-002',
      'step-003',
      'step-004',
      'step-005'
    ])

    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-001'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: 'cloud.frontend',
        inEdges: ['step-001'],
        outEdges: ['step-002']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        inEdges: ['step-002'],
        outEdges: []
      },
      {
        id: 'cloud.backend',
        parent: null,
        inEdges: [
          'step-002',
          'step-004'
        ],
        outEdges: [
          'step-003',
          'step-005'
        ]
      },
      {
        id: 'amazon',
        parent: null,
        inEdges: ['step-003'],
        outEdges: ['step-004']
      },
      {
        id: 'cloud.frontend',
        parent: null,
        outEdges: ['step-002'],
        inEdges: [
          'step-001',
          'step-005'
        ]
      }
    ])
    const [step1, step2, step3, step4, step5] = edges
    expect(step1).toMatchObject({
      id: 'step-001',
      source: 'customer',
      ...defaultStepProps,
      target: 'cloud.frontend.dashboard',
      label: 'opens in browser' // inferred from relations
    })
    expect(step1).not.toHaveProperty('dir')
    expect(step2).toMatchObject({
      id: 'step-002',
      source: 'cloud.frontend.dashboard',
      target: 'cloud.backend.graphql',
      ...defaultStepProps,
      label: 'requests' // inferred from relations
    })
    expect(step2).not.toHaveProperty('dir')
    expect(step3).toMatchObject({
      id: 'step-003',
      source: 'cloud.backend',
      target: 'amazon',
      ...defaultStepProps,
      label: 'uploads' // inferred from relations
    })
    expect(step3).not.toHaveProperty('dir')
    expect(step4).toMatchObject({
      id: 'step-004',
      source: 'amazon',
      target: 'cloud.backend',
      ...defaultStepProps,
      label: null,
      dir: 'back'
    })
    expect(step5).toMatchObject({
      id: 'step-005',
      source: 'cloud.backend',
      ...defaultStepProps,
      target: 'cloud.frontend',
      color: 'red',
      line: 'dotted',
      label: null,
      dir: 'back'
    })

    // expect(edges).toMatchObject([
    //   {
    //     id: 'step-001',
    //     source: 'customer',
    //     target: 'cloud.frontend.dashboard',
    //     dir: 'forward',
    //     label: 'open dashboard'
    //   },
    //   {
    //     id: 'step-002',
    //     source: 'cloud.frontend.dashboard',
    //     target: 'cloud.backend.graphql',
    //     dir: 'forward',
    //     label: null
    //   },
    //   {
    //     id: 'step-003',
    //     source: 'cloud.backend.graphql',
    //     target: 'cloud.frontend.dashboard',
    //     dir: 'back',
    //     label: 'return data'
    //   }
    // ])
  })

  it('should apply steps custom props', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('cloud.backend -> amazon', {
        line: 'dotted',
        description: 'uploads1',
        head: 'open',
        tail: 'odot',
        color: 'red'
      })
    ])
    expect(nodeIds).toEqual([
      'cloud.backend',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'step-001'
    ])
    const [step1] = edges
    expect(step1).toMatchObject({
      line: 'dotted',
      description: 'uploads1',
      head: 'open',
      tail: 'odot',
      color: 'red',
      'id': 'step-001',
      'label': 'uploads',
      'source': 'cloud.backend',
      'target': 'amazon'
    })
  })

  it('should include nodes and edges from rules', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('customer -> cloud.frontend.dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      $include('cloud'),
      $step('cloud.frontend.dashboard <- cloud.backend.graphql')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'cloud'
    ])
    expect(edgeIds).toEqual([
      'step-001',
      'step-002',
      'step-003'
    ])

    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-001'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: 'cloud',
        inEdges: [
          'step-001',
          'step-003'
        ],
        outEdges: ['step-002']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud',
        inEdges: ['step-002'],
        outEdges: ['step-003']
      },
      {
        id: 'cloud',
        parent: null,
        inEdges: [
          'step-001'
        ],
        outEdges: []
      }
    ])
    const [step1, step2, step3] = edges
    expect(step1).toMatchObject({
      ...defaultStepProps,
      id: 'step-001',
      source: 'customer',
      target: 'cloud.frontend.dashboard',
      label: 'opens in browser' // inferred from relations
    })
    expect(step1).not.toHaveProperty('dir')
    expect(step2).toMatchObject({
      ...defaultStepProps,
      id: 'step-002',
      source: 'cloud.frontend.dashboard',
      target: 'cloud.backend.graphql',
      label: 'requests' // inferred from relations
    })
    expect(step2).not.toHaveProperty('dir')
    expect(step3).toMatchObject({
      ...defaultStepProps,
      id: 'step-003',
      source: 'cloud.backend.graphql',
      target: 'cloud.frontend.dashboard',
      label: null
    })
    expect(step3).toHaveProperty('dir', 'back')
  })

  it('should include nodes and edges from rules (even not relative)', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('customer -> cloud.frontend.dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      // Include expanded node
      $include('amazon._')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'amazon',
      'amazon.s3'
    ])
    expect(edgeIds).toEqual([
      'step-001',
      'step-002'
    ])

    const common = {
      children: expect.any(Array),
      color: expect.any(String),
      description: null,
      'kind': expect.any(String),
      'level': expect.any(Number),
      'links': null,
      'parent': null,
      'shape': expect.any(String),
      'style': expect.any(Object),
      'tags': null,
      'technology': null,
      'title': expect.any(String)
    }

    expect(nodes).toMatchObject([
      {
        ...common,
        id: 'customer',
        parent: null,
        outEdges: ['step-001'],
        inEdges: []
      },
      {
        ...common,
        id: 'cloud.frontend.dashboard',
        parent: null,
        inEdges: [
          'step-001'
        ],
        outEdges: ['step-002'],
        tags: ['next']
      },
      {
        ...common,
        id: 'cloud.backend.graphql',
        parent: null,
        inEdges: ['step-002'],
        outEdges: []
      },
      {
        ...common,
        id: 'amazon',
        parent: null,
        inEdges: [],
        outEdges: [],
        tags: ['aws']
      },
      {
        ...common,
        id: 'amazon.s3',
        parent: 'amazon',
        inEdges: [],
        outEdges: [],
        tags: ['aws']
      }
    ])
  })
})
