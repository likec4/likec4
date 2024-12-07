import { prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { LikeC4Model } from '../index'
import { computedModel } from './fixture'

describe('DeploymentElementModel', () => {
  const model = LikeC4Model.create(computedModel)
  const deployment = model.deployment

  it('Instance: incoming/outgoing from model', () => {
    const it = deployment.node('customer').children()
    let res = it.next()

    expect(res.value).toBeDefined()

    res = it.next()
    console.log(res)
    expect(res.done).toBe(true)

    const media = deployment.instance('prod.eu.media')
    const incoming = media.incomingFromModel()
    expect([...incoming].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.backend.api -> cloud.media'
    ])

    const outgoing = media.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.media -> aws.s3'
    ])

    // Should be cached
    expect(media.incomingFromModel()).toBe(incoming)
    expect(media.outgoingFromModel()).toBe(outgoing)
  })

  it('DeploymentNode: incoming/outgoing from model', () => {
    const zone1 = deployment.node('prod.eu.zone1')
    const incoming = zone1.incomingFromModel()
    expect([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.backend.api'
    ])

    const outgoing = zone1.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.backend.api -> cloud.auth',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
      'cloud.backend.api -> email'
    ])

    // Should be cached
    expect(zone1.incomingFromModel()).toBe(incoming)
    expect(zone1.outgoingFromModel()).toBe(outgoing)
  })

  it('DeploymentNode: incoming/outgoing from model (unique only)', () => {
    const eu = deployment.node('prod.eu')
    const incoming = eu.incomingFromModel()
    expect([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds'
    ])

    const outgoing = eu.outgoingFromModel()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.backend.api -> cloud.auth',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
      'cloud.backend.api -> email',
      'cloud.media -> aws.s3'
    ])

    // Should be cached
    expect(eu.incomingFromModel()).toBe(incoming)
    expect(eu.outgoingFromModel()).toBe(outgoing)
  })
})
