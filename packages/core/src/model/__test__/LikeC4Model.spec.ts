import { prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { LikeC4Model } from '../LikeC4Model'
import { fakeComputedModel, fakeElements } from './fixture'

describe('LikeC4Model', () => {
  const model = LikeC4Model.from(fakeComputedModel)

  it('roots', () => {
    expect(model.roots().map(prop('id'))).toEqual([
      'customer',
      'support',
      'cloud',
      'email',
      'amazon'
    ])
  })

  it('parent and chilren', () => {
    const parent = model.parent('cloud.backend.graphql')!
    expect(parent.id).toEqual('cloud.backend')
    expect(parent.element).toStrictEqual(fakeElements['cloud.backend'])

    const children = parent.children()

    expect(children.map(prop('id'))).toEqual(['cloud.backend.graphql', 'cloud.backend.storage'])
  })

  it('siblings of root', () => {
    const siblings = model.element('cloud').siblings()
    expect(siblings.map(prop('id'))).toEqual([
      'customer',
      'support',
      'email',
      'amazon'
    ])
  })

  it('siblings', () => {
    const backend = model.element('cloud.backend')

    const siblings = backend.siblings()

    expect(siblings.map(prop('id'))).toEqual(['cloud.frontend'])
  })

  it('internal relations', () => {
    model.internal('cloud.backend')
  })
})
