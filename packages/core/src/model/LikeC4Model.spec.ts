import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { computed, model, type TestFqn } from './__test__/fixture'

describe('LikeC4Model', () => {
  const els = computed.elements

  it('roots', () => {
    expect([...model.roots()].map(prop('id'))).toEqual([
      'customer',
      'cloud',
      'aws',
      'email',
    ])
  })

  it('parent and children', () => {
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

  it('ancestors in right order', () => {
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

  it('siblings of root', () => {
    const siblings = [...model.element('cloud').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'customer',
      'aws',
      'email',
    ])
  })

  it('siblings of nested', () => {
    const siblings = [...model.element('cloud.backend').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'cloud.frontend',
      'cloud.auth',
      'cloud.media',
    ])
  })

  it('ascendingSiblings', () => {
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

  it('descendants in right order', () => {
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

  it('filter incoming: direct', () => {
    const incoming = [...model.element('cloud').incoming('direct')].map(r => r.expression)
    expect(incoming).toEqual([
      'customer -> cloud',
    ])
    const incomers = [...model.element('cloud').incomers('direct')].map(prop('id'))
    expect(incomers).toEqual([
      'customer',
    ])
  })

  it('filter incoming: to-descendants', () => {
    const incoming = [...model.element('cloud').incoming('to-descendants')].map(r => r.expression)
    expect(incoming).toEqual([
      'customer -> cloud.frontend.mobile',
      'customer -> cloud.frontend.dashboard',
    ])
  })

  it('filter outgoing: direct', () => {
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

  it('unique incomers', () => {
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

  it('unique outgoers', () => {
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

  it('views with element', () => {
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
})
