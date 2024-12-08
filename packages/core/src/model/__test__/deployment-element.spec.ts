import { prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { LikeC4Model } from '../index'
import { computedModel } from './fixture'

describe('DeploymentElementModel', () => {
  const model = LikeC4Model.create(computedModel)
  const deployment = model.deployment

  it('Instance: incoming/outgoing from model', () => {
    const media = deployment.instance('prod.eu.media')
    const incoming = media.incomingFromModel()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.backend.api -> cloud.media'
    ])

    const outgoing = media.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.media -> aws.s3'
    ])
  })

  it('DeploymentNode: incoming/outgoing from model', () => {
    const zone1 = deployment.node('prod.eu.zone1')
    const incoming = zone1.incomingFromModel()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      // 'cloud.frontend.dashboard -> cloud.backend.api', this is internal relation
      'cloud.frontend.mobile -> cloud.backend.api'
    ])

    const outgoing = zone1.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      // 'cloud.frontend.dashboard -> cloud.backend.api', this is internal relation
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.backend.api -> cloud.auth',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
      'cloud.backend.api -> email'
    ])
  })

  it('DeploymentNode: incoming/outgoing from model (unique only)', () => {
    const eu = deployment.node('prod.eu')
    const incoming = eu.incomingFromModel()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      // 'cloud.frontend.dashboard -> cloud.backend.api', this is internal relation
      'cloud.frontend.mobile -> cloud.backend.api',
      // 'cloud.frontend.dashboard -> cloud.media', this is internal relation
      'cloud.frontend.mobile -> cloud.media'
      // 'cloud.backend.api -> cloud.media', this is internal relation
      // 'cloud.backend.api -> aws.rds' this is internal relation
    ])

    const outgoing = eu.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      // 'cloud.frontend.dashboard -> cloud.backend.api', this is internal relation
      // 'cloud.frontend.dashboard -> cloud.media', this is internal relation
      'cloud.backend.api -> cloud.auth',
      // 'cloud.backend.api -> cloud.media', this is internal relation
      // 'cloud.backend.api -> aws.rds', this is internal relation
      'cloud.backend.api -> email',
      'cloud.media -> aws.s3'
    ])
  })
})
