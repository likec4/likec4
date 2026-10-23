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
        color direction #ff0000
        color back #00ff00
        relationship forward
      }
      model {
        back back {
          style {
            color direction
          }
        }
        forward forward
        direction direction
        back -> forward
        forward .forward direction
      }
    `)
    expect(diagnostics).toEqual([])
  })

  describe('backward relation syntax', () => {
    it('parses a <- b as relation from b to a with direction back', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
          relationship subscribes
          tag tag1
        }
        model {
          component producer {
            <- consumer2 'implicit'
          }
          component consumer
          component consumer2
          component consumer3
          producer <- consumer
          producer <-[subscribes]- consumer3 'events' 'description' 'kafka' #tag1 {
            metadata {
              key 'value'
            }
          }
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      const relations = values(model.$data.relations)
      expect(relations).toHaveLength(3)
      expect(relations).toEqual(expect.arrayContaining([
        expect.objectContaining({
          source: { model: 'consumer2' },
          target: { model: 'producer' },
          title: 'implicit',
          direction: 'back',
        }),
        expect.objectContaining({
          source: { model: 'consumer' },
          target: { model: 'producer' },
          direction: 'back',
        }),
        expect.objectContaining({
          source: { model: 'consumer3' },
          target: { model: 'producer' },
          kind: 'subscribes',
          title: 'events',
          description: { txt: 'description' },
          technology: 'kafka',
          tags: ['tag1'],
          metadata: { key: 'value' },
          direction: 'back',
        }),
      ]))
    })

    it('explicit direction in style overrides backward syntax', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
          a <- b {
            style {
              direction forward
            }
          }
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      expect(values(model.$data.relations)).toEqual([
        expect.objectContaining({
          source: { model: 'b' },
          target: { model: 'a' },
          direction: 'forward',
        }),
      ])
    })

    it('parses without spaces and with dashed identifiers', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
          relationship subscribes
        }
        model {
          component my-svc
          component other-svc
          my-svc<-other-svc
          my-svc<-[subscribes]-other-svc
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      expect(values(model.$data.relations).map(r => [r.source, r.target, r.kind ?? null])).toEqual([
        [{ model: 'other-svc' }, { model: 'my-svc' }, null],
        [{ model: 'other-svc' }, { model: 'my-svc' }, 'subscribes'],
      ])
    })

    it('can be extended with semantic direction', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
          relationship subscribes
        }
        model {
          component producer
          component consumer
          producer <-[subscribes]- consumer 'events'
          extend consumer -[subscribes]-> producer 'events' {
            metadata {
              key 'value'
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
          metadata: { key: 'value' },
        }),
      ])
    })

    it('reports parent-child relationship', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component a {
            component b
          }
          a <- a.b
        }
      `)
      expect(errors).toEqual(['Invalid parent-child relationship'])
    })

    it('parses backward deployment relation', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
          deploymentNode node
          relationship subscribes
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
          n2.p <-[subscribes]- n1.c 'events'
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      expect(values(model.$data.deployments.relations)).toEqual([
        expect.objectContaining({
          source: { deployment: 'n1.c' },
          target: { deployment: 'n2.p' },
          kind: 'subscribes',
          direction: 'back',
        }),
      ])
    })

    it('acceptance example', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element system
          element component
          relationship subscribes
        }
        model {
          sys = system {
            producer = component
            consumer = component
          }
          external = system
          sys.producer -> external 'sends data'
          // consumer depends on producer, but producer should be laid out before consumer
          sys.producer <-[subscribes]- sys.consumer 'events'
        }
        views {
          view index {
            include *, sys.*
            autoLayout LeftRight
          }
          view matching {
            include sys.consumer -> sys.producer
          }
          view reversed {
            include sys.producer -> sys.consumer
          }
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      expect(model.view('index').$view.edges.find(e => e.source === 'sys.consumer')).toMatchObject({
        source: 'sys.consumer',
        target: 'sys.producer',
        label: 'events',
        kind: 'subscribes',
        dir: 'back',
      })
      expect(model.view('matching').$view.edges).toHaveLength(1)
      expect(model.view('reversed').$view.edges).toHaveLength(0)
    })

    it('keeps backward steps in dynamic views', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      const { diagnostics } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
          a <- b
        }
        views {
          dynamic view index {
            b -> a 'request'
            b <- a 'response'
          }
        }
      `)
      expect(diagnostics).toEqual([])
      const model = await buildLikeC4Model()
      const edges = model.view('index').$view.edges
      expect(edges.map(e => [e.source, e.target, e.dir ?? null])).toEqual([
        ['b', 'a', null],
        ['a', 'b', 'back'],
      ])
    })
  })
})
