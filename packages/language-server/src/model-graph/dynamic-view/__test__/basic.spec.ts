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
      'step-01',
      'step-02',
      'step-03'
    ])
    expect(edges).toMatchObject([
      {
        id: 'step-01',
        source: 'customer',
        target: 'cloud.frontend.dashboard',
        label: 'open dashboard'
      },
      {
        id: 'step-02',
        source: 'cloud.frontend.dashboard',
        target: 'cloud.backend.graphql',
        label: 'requests', // inferred from relations,
        tags: ['next'],
        relations: [
          'cloud.frontend.dashboard:cloud.backend.graphql'
        ]
      },
      {
        id: 'step-03',
        source: 'cloud.backend.graphql',
        target: 'cloud.frontend.dashboard',
        dir: 'back',
        label: 'return data',
        relations: []
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
      'step-01',
      'step-02',
      'step-03',
      'step-04',
      'step-05'
    ])

    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-01'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: 'cloud.frontend',
        inEdges: ['step-01'],
        outEdges: ['step-02']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        inEdges: ['step-02'],
        outEdges: []
      },
      {
        id: 'cloud.backend',
        parent: null,
        inEdges: [
          'step-02',
          'step-04'
        ],
        outEdges: [
          'step-03',
          'step-05'
        ]
      },
      {
        id: 'amazon',
        parent: null,
        inEdges: ['step-03'],
        outEdges: ['step-04']
      },
      {
        id: 'cloud.frontend',
        parent: null,
        outEdges: ['step-02'],
        inEdges: [
          'step-01',
          'step-05'
        ]
      }
    ])
    const [step1, step2, step3, step4, step5] = edges
    expect(step1).toMatchObject({
      id: 'step-01',
      source: 'customer',
      ...defaultStepProps,
      target: 'cloud.frontend.dashboard',
      label: 'opens in browser' // inferred from relations
    })
    expect(step1).not.toHaveProperty('dir')
    expect(step2).toMatchObject({
      id: 'step-02',
      source: 'cloud.frontend.dashboard',
      target: 'cloud.backend.graphql',
      ...defaultStepProps,
      label: 'requests' // inferred from relations
    })
    expect(step2).not.toHaveProperty('dir')
    expect(step3).toMatchObject({
      id: 'step-03',
      source: 'cloud.backend',
      target: 'amazon',
      ...defaultStepProps,
      label: 'uploads' // inferred from relations
    })
    expect(step3).not.toHaveProperty('dir')
    expect(step4).toMatchObject({
      id: 'step-04',
      source: 'amazon',
      target: 'cloud.backend',
      ...defaultStepProps,
      label: null,
      dir: 'back'
    })
    expect(step5).toMatchObject({
      id: 'step-05',
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
    //     id: 'step-01',
    //     source: 'customer',
    //     target: 'cloud.frontend.dashboard',
    //     dir: 'forward',
    //     label: 'open dashboard'
    //   },
    //   {
    //     id: 'step-02',
    //     source: 'cloud.frontend.dashboard',
    //     target: 'cloud.backend.graphql',
    //     dir: 'forward',
    //     label: null
    //   },
    //   {
    //     id: 'step-03',
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
      'step-01'
    ])
    const [step1] = edges
    expect(step1).toMatchObject({
      line: 'dotted',
      description: 'uploads1',
      head: 'open',
      tail: 'odot',
      color: 'red',
      'id': 'step-01',
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
      'step-01',
      'step-02',
      'step-03'
    ])

    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-01'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: 'cloud',
        inEdges: [
          'step-01',
          'step-03'
        ],
        outEdges: ['step-02']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud',
        inEdges: ['step-02'],
        outEdges: ['step-03']
      },
      {
        id: 'cloud',
        parent: null,
        inEdges: [
          'step-01'
        ],
        outEdges: []
      }
    ])
    const [step1, step2, step3] = edges
    expect(step1).toMatchObject({
      ...defaultStepProps,
      id: 'step-01',
      source: 'customer',
      target: 'cloud.frontend.dashboard',
      label: 'opens in browser' // inferred from relations
    })
    expect(step1).not.toHaveProperty('dir')
    expect(step2).toMatchObject({
      ...defaultStepProps,
      id: 'step-02',
      source: 'cloud.frontend.dashboard',
      target: 'cloud.backend.graphql',
      label: 'requests' // inferred from relations
    })
    expect(step2).not.toHaveProperty('dir')
    expect(step3).toMatchObject({
      ...defaultStepProps,
      id: 'step-03',
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
      'step-01',
      'step-02'
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
        outEdges: ['step-01'],
        inEdges: []
      },
      {
        ...common,
        id: 'cloud.frontend.dashboard',
        parent: null,
        inEdges: [
          'step-01'
        ],
        outEdges: ['step-02'],
        tags: ['next']
      },
      {
        ...common,
        id: 'cloud.backend.graphql',
        parent: null,
        inEdges: ['step-02'],
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
        tags: ['aws', 'storage']
      }
    ])
  })
})
