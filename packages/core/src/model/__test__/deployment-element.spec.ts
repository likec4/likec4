import { prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { model } from './fixture'

describe('DeploymentElementModel', () => {
  const deployment = model.deployment

  it('Instance: incoming/outgoing from model', () => {
    const media = deployment.instance('prod.eu.media')
    const incoming = media.incomingModelRelationships()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.backend.api -> cloud.media',
    ])

    const outgoing = media.outgoingModelRelationships()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.media -> aws.s3',
    ])
  })

  it('DeploymentNode: incoming/outgoing from model', () => {
    const zone1 = deployment.node('prod.eu.zone1')
    const incoming = zone1.incomingModelRelationships()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.backend.api',
    ])

    const outgoing = zone1.outgoingModelRelationships()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.backend.api -> cloud.auth',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
      'cloud.backend.api -> email',
    ])
  })

  it('DeploymentNode: incoming/outgoing from model (unique only)', () => {
    const eu = deployment.node('prod.eu')
    const incoming = eu.incomingModelRelationships()
    expect.soft([...incoming].map(prop('expression'))).toEqual([
      'customer -> cloud.frontend.dashboard',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.mobile -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.frontend.mobile -> cloud.media',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
    ])

    const outgoing = eu.outgoingModelRelationships()
    expect([...outgoing].map(prop('expression'))).toEqual([
      'cloud.frontend.dashboard -> cloud.auth',
      'cloud.frontend.dashboard -> cloud.backend.api',
      'cloud.frontend.dashboard -> cloud.media',
      'cloud.backend.api -> cloud.auth',
      'cloud.backend.api -> cloud.media',
      'cloud.backend.api -> aws.rds',
      'cloud.backend.api -> email',
      'cloud.media -> aws.s3',
    ])
  })
})
