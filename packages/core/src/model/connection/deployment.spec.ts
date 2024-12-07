import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'

import { computedModel } from '../__test__/fixture'
import { LikeC4Model } from '../index'
import { findConnection, findConnectionsWithin } from './deployment'

describe('Find deployment connections', () => {
  const model = LikeC4Model.create(computedModel)
  const deployment = model.deployment

  it('findConnection', () => {
    const [connection] = findConnection(
      deployment.element('customer'),
      deployment.element('prod.eu')
    )
    expect(connection).toBeDefined()
    expect(connection!.expression).toBe('customer -> prod.eu')
    expect(map([...connection!.values()], prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard'
    ])
  })

  it('findAllConnectionsWithin', () => {
    const conns = findConnectionsWithin([
      deployment.element('customer'),
      deployment.element('prod.eu.zone1.ui'),
      deployment.element('prod.eu.zone2.api'),
      deployment.element('prod.eu.media')
    ])
    expect(conns.map(prop('expression'))).toEqual([
      'customer -> prod.eu.zone1.ui',
      'prod.eu.zone1.ui -> prod.eu.zone2.api',
      'prod.eu.zone1.ui -> prod.eu.media',
      'prod.eu.zone2.api -> prod.eu.media'
    ])
  })
})
