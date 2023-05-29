import { describe, it, expect, beforeEach } from 'vitest'
import type { Fqn } from '../types'
import { fakeModel } from '../__test__'
import { ComputeCtx } from './compute-ctx'

describe('ComputeCtx', () => {
  const index = fakeModel()
  let ctx: ComputeCtx

  const E = {
    customer: index.find('customer' as Fqn),
    amazon: index.find('amazon' as Fqn),
    cloud: index.find('cloud' as Fqn),
    cloudBackend: index.find('cloud.backend' as Fqn),
    cloudBackendGraph: index.find('cloud.backend.graphql' as Fqn),
    cloudFrontend: index.find('cloud.frontend' as Fqn),
    support: index.find('support' as Fqn)
  }

  beforeEach(() => {
    ctx = new ComputeCtx(index, 'cloud' as Fqn)
  })

  it('include elements', () => {
    ctx = new ComputeCtx(
      index,
      null,
      new Set([E.cloudBackendGraph]),
      new Set(),
      new Set([E.support, E.cloudFrontend]),
    )
    const newCtx = ctx.include({
      elements: [E.customer, E.cloud]
    })
    expect([...newCtx.elements]).to.have.members([E.customer, E.cloud, E.cloudBackendGraph])
    // should remove cloudFrontend from implicits
    // expect([...newCtx.implicits]).toEqual([E.support])
  })

  it('exclude elements', () => {
    ctx = new ComputeCtx(index, 'cloud' as Fqn, new Set([E.customer, E.cloud, E.cloudBackendGraph]))
    const newCtx = ctx.exclude({
      elements: [E.customer]
    })
    expect([...newCtx.elements]).to.have.members([E.cloud, E.cloudBackendGraph])
  })
})
