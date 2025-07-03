import { map, prop } from 'remeda'
import { describe, it } from 'vitest'
import { type TestFqn, computed, model, parsed } from './__test__/fixture'
import { LikeC4Model } from './LikeC4Model'

describe('LikeC4Model', () => {
  const els = computed.elements

  it('roots', ({ expect }) => {
    expect([...model.roots()].map(prop('id'))).toEqual([
      'customer',
      'cloud',
      'aws',
      'email',
    ])
  })

  it('all tags', ({ expect }) => {
    expect(model.tags).toEqual([
      'external',
      'internal',
      'tag1',
      'tag2',
    ])

    // Check memoization
    const tags1 = model.tags
    const tags2 = model.tags
    expect(tags1).toBe(tags2)

    expect(map(model.tagsSortedByUsage, t => ({
      tag: t.tag,
      count: t.count,
      tagged: [...t.tagged].map(prop('id')),
    }))).toEqual([
      {
        tag: 'tag2',
        count: 3,
        tagged: [
          'cloud.media',
          'aws.rds',
          'aws.s3',
        ],
      },
      {
        count: 1,
        tag: 'external',
        tagged: [
          'email',
        ],
      },
      {
        count: 1,
        tag: 'internal',
        tagged: [
          'cloud.frontend.dashboard',
        ],
      },
      {
        count: 1,
        tag: 'tag1',
        tagged: [
          'cloud.frontend.dashboard',
        ],
      },
    ])

    expect(model.tagsSortedByUsage).toBe(model.tagsSortedByUsage)
  })

  it('element tags', ({ expect }) => {
    expect(model.element('cloud.frontend.dashboard').tags).toEqual([
      'tag1',
      'internal',
    ])
    expect(model.element('aws.rds').tags).toEqual([
      'tag2',
    ])
    expect(model.element('email').tags).toEqual([
      'external',
    ])
    expect(model.element('cloud.media').tags).toEqual([
      'tag2',
    ])

    // Check memoization
    const tags1 = model.element('cloud.frontend.dashboard').tags
    const tags2 = model.element('cloud.frontend.dashboard').tags
    expect(tags1).toBe(tags2)
  })

  it('parent and children', ({ expect }) => {
    const el = model.element('cloud.backend.api')
    const parent = el.parent!
    expect(parent.id).toEqual('cloud.backend')
    expect(parent.$element).toStrictEqual(els['cloud.backend'])

    const children = [...parent.children()]

    expect(map(children, prop('id'))).toEqual([
      'cloud.backend.api',
      'cloud.backend.graphql',
    ])
  })

  it('ancestors in right order', ({ expect }) => {
    const ancestors = [...model.element('cloud.frontend.dashboard').ancestors()]
    expect(ancestors).toHaveLength(2)
    expect(ancestors[0]).toMatchObject({
      id: 'cloud.frontend',
      $element: els['cloud.frontend'],
    })
    expect(ancestors[1]).toMatchObject({
      id: 'cloud',
      $element: els['cloud'],
    })
  })

  it('siblings of root', ({ expect }) => {
    const siblings = [...model.element('cloud').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'customer',
      'aws',
      'email',
    ])
  })

  it('siblings of nested', ({ expect }) => {
    const siblings = [...model.element('cloud.backend').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'cloud.frontend',
      'cloud.auth',
      'cloud.media',
    ])
  })

  it('ascendingSiblings', ({ expect }) => {
    const siblings = [...model.element('cloud.backend.graphql').ascendingSiblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'cloud.backend.api',
      'cloud.frontend',
      'cloud.auth',
      'cloud.media',
      'customer',
      'aws',
      'email',
    ])
  })

  it('descendants in right order', ({ expect }) => {
    const descendants = [...model.element('cloud').descendants()].map(prop('id'))
    expect(descendants).toEqual([
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.frontend.mobile',
      'cloud.auth',
      'cloud.backend',
      'cloud.backend.api',
      'cloud.backend.graphql',
      'cloud.media',
    ])
  })

  it('filter incoming: direct', ({ expect }) => {
    const incoming = [...model.element('cloud').incoming('direct')].map(r => r.expression)
    expect(incoming).toEqual([
      'customer -> cloud',
    ])
    const incomers = [...model.element('cloud').incomers('direct')].map(prop('id'))
    expect(incomers).toEqual([
      'customer',
    ])
  })

  it('filter incoming: to-descendants', ({ expect }) => {
    const incoming = [...model.element('cloud').incoming('to-descendants')].map(r => r.expression)
    expect(incoming).toEqual([
      'customer -> cloud.frontend.mobile',
      'customer -> cloud.frontend.dashboard',
    ])
  })

  it('filter outgoing: direct', ({ expect }) => {
    const frontend = model.element('cloud.frontend')
    let outgoing = [...frontend.outgoing()].map(r => r.expression)
    expect(outgoing).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.auth',
      'cloud.frontend.mobile -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.frontend -> cloud.backend',
    ])

    outgoing = [...frontend.outgoing('direct')].map(r => r.expression)
    expect(outgoing).toEqual([
      'cloud.frontend -> cloud.backend',
    ])

    outgoing = [...frontend.outgoing('from-descendants')].map(r => r.expression)
    expect(outgoing).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.auth',
      'cloud.frontend.mobile -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.media',
    ])
  })

  it('unique incomers', ({ expect }) => {
    const incoming = [...model.element('cloud').incoming()].map(prop('expression'))
    expect(incoming).toEqual([
      'customer -> cloud',
      'customer -> cloud.frontend.mobile',
      'customer -> cloud.frontend.dashboard',
    ])
    const incomers = [...model.element('cloud').incomers()].map(prop('id'))
    expect(incomers).toEqual([
      'customer',
    ])
  })

  it('unique outgoers', ({ expect }) => {
    const outgoing = [...model.element('cloud.frontend').outgoing()].map(r => `${r.source.id}:${r.target.id}`)
    expect(outgoing).toEqual([
      'cloud.frontend.dashboard:cloud.auth',
      'cloud.frontend.dashboard:cloud.backend.api',
      'cloud.frontend.dashboard:cloud.media',
      'cloud.frontend.mobile:cloud.auth',
      'cloud.frontend.mobile:cloud.backend.api',
      'cloud.frontend.mobile:cloud.media',
      'cloud.frontend:cloud.backend',
    ])
    const outgoers = [...model.element('cloud.frontend').outgoers()].map(prop('id'))
    expect(outgoers).toEqual([
      'cloud.auth',
      'cloud.backend.api',
      'cloud.media',
      'cloud.backend',
    ])
  })

  it('should not include views if built from parsed data ', ({ expect }) => {
    const m = LikeC4Model.create(parsed)
    expect([...m.views()].map(prop('id'))).toEqual([])

    // But computed model should have views
    expect([...model.views()].map(prop('id'))).toEqual([
      'index',
      'cloud',
      'prod',
    ])
  })

  it('views with element', ({ expect }) => {
    const views = (id: TestFqn) => [...model.element(id).views()].map(prop('id'))

    expect.soft(views('cloud')).toEqual([
      'index',
      'cloud',
    ])

    expect.soft(views('cloud.frontend.dashboard')).toEqual([
      'cloud',
      'prod',
    ])

    expect.soft(views('customer')).toEqual([
      'index',
      'cloud',
      'prod',
    ])
  })

  it('elements where', ({ expect }) => {
    const elements = [...model.elementsWhere({
      kind: 'system',
    })]

    expect(elements).toEqual([
      model.element('cloud'),
      model.element('aws'),
      model.element('email'),
    ])

    expect([
      ...model.elementsWhere({
        and: [
          { kind: 'system' },
          { tag: 'external' },
        ],
      }),
    ].map(prop('id'))).toEqual([
      'email',
    ])

    expect([
      ...model.elementsWhere({
        and: [
          { kind: 'system' },
          {
            tag: {
              neq: 'external',
            },
          },
        ],
      }),
    ].map(prop('id'))).toEqual([
      'cloud',
      'aws',
    ])
  })

  it('relationships where', ({ expect }) => {
    const toSystem = [...model.relationshipsWhere({
      participant: 'target',
      operator: {
        kind: 'system',
      },
    })].map(r => r.expression)

    expect(toSystem).toEqual([
      'customer -> cloud',
      'cloud.backend.api -> email',
      'cloud -> email',
    ])
  })
})
