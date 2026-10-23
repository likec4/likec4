import { values } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('Model Builder - relationship direction', () => {
  it('parses direction in relationship style', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component consumer
        component producer
        consumer -> producer {
          style {
            direction back
          }
        }
        producer -> consumer {
          style {
            direction: forward;
          }
        }
      }
    `)
    expect(diagnostics).toEqual([])
    const model = await buildLikeC4Model()
    expect(values(model.$data.relations)).toEqual([
      expect.objectContaining({
        source: { model: 'consumer' },
        target: { model: 'producer' },
        direction: 'back',
      }),
      expect.objectContaining({
        source: { model: 'producer' },
        target: { model: 'consumer' },
        direction: 'forward',
      }),
    ])
  })

  it('inherits direction from relationship kind', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        relationship subscribes {
          direction back
        }
      }
      model {
        component consumer
        component producer
        component other
        consumer -[subscribes]-> producer
        other .subscribes producer {
          style {
            direction forward
          }
        }
      }
    `)
    expect(diagnostics).toEqual([])
    const model = await buildLikeC4Model()
    // buildModel nests relationship kind styles under `style`
    expect(model.specification.relationships['subscribes']).toMatchObject({
      style: { direction: 'back' },
    })
    const [first, second] = values(model.$data.relations)
    expect(first).toMatchObject({
      kind: 'subscribes',
      direction: 'back',
    })
    expect(second).toMatchObject({
      kind: 'subscribes',
      direction: 'forward',
    })
  })

  it('computes view edges with dir back and keeps semantic direction', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element system
        element component
        relationship subscribes {
          direction back
        }
      }
      model {
        sys = system {
          producer = component
          consumer = component
        }
        external = system
        sys.producer -> external 'sends data'
        sys.consumer -[subscribes]-> sys.producer 'events'
      }
      views {
        view index {
          include *, sys.*
          autoLayout LeftRight
        }
        view forward {
          include *, sys.*
          include sys.consumer -> sys.producer with {
            direction forward
          }
        }
        view only-matching {
          include sys.consumer -> sys.producer
        }
      }
    `)
    expect(diagnostics).toEqual([])
    const model = await buildLikeC4Model()

    const index = model.view('index').$view
    const edge = index.edges.find(e => e.source === 'sys.consumer')
    expect(edge).toMatchObject({
      source: 'sys.consumer',
      target: 'sys.producer',
      label: 'events',
      dir: 'back',
    })
    expect(index.edges.find(e => e.source === 'sys.producer')).not.toHaveProperty('dir')

    const forward = model.view('forward').$view
    expect(forward.edges.find(e => e.source === 'sys.consumer')).not.toHaveProperty('dir')

    const onlyMatching = model.view('only-matching').$view
    expect(onlyMatching.edges).toHaveLength(1)
    expect(onlyMatching.edges[0]).toMatchObject({
      source: 'sys.consumer',
      target: 'sys.producer',
      dir: 'back',
    })
  })

  it('inherits view-level direction in extended views', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component a
        component b
        component c
        a -> b
        a -> c
      }
      views {
        view parent {
          include *
          include a -> b with {
            direction back
          }
        }
        view child extends parent {
          include a -> c with {
            direction back
          }
        }
        view override extends parent {
          include a -> b with {
            direction forward
          }
        }
      }
    `)
    expect(diagnostics).toEqual([])
    const model = await buildLikeC4Model()
    const dirs = (viewId: string) =>
      Object.fromEntries(model.view(viewId).$view.edges.map(e => [`${e.source} -> ${e.target}`, e.dir ?? null]))
    expect(dirs('parent')).toEqual({
      'a -> b': 'back',
      'a -> c': null,
    })
    expect(dirs('child')).toEqual({
      'a -> b': 'back',
      'a -> c': 'back',
    })
    expect(dirs('override')).toEqual({
      'a -> b': null,
      'a -> c': null,
    })
  })

  it('parses direction in deployment relationship', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        deploymentNode node
      }
      model {
        component consumer
        component producer
      }
      deployment {
        node n1 {
          c = instanceOf consumer
        }
        node n2 {
          p = instanceOf producer
        }
        n1.c -> n2.p {
          style {
            direction back
          }
        }
      }
    `)
    expect(diagnostics).toEqual([])
    const model = await buildLikeC4Model()
    expect(values(model.$data.deployments.relations)).toEqual([
      expect.objectContaining({
        direction: 'back',
      }),
    ])
  })

  it('allows direction keywords as identifiers', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element back
        element forward
        element direction
      }
      model {
        back back
        forward forward
        direction direction
        back -> forward
        forward -> direction
      }
    `)
    expect(diagnostics).toEqual([])
  })
})
