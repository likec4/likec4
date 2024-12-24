import { describe, expect, it } from 'vitest'
import type { DeploymentViewRuleBuilderOp } from '../../../builder/Builder.view'
import { $exclude, $include, computeNodesAndEdges, type Types } from './fixture'

function expectComputed(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  return expect(computeNodesAndEdges(...rules))
}

describe('DirectRelationPredicate', () => {
  it('should include direct relation if it matches condition', () => {
    expectComputed(
      $include('customer -> prod.eu', {where: 'tag is #old'})
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu",
        ],
        "edges": [
          "customer:prod.eu",
        ],
      }
    `)
  })

  it('should not include direct relation if it does not match condition', () => {
    expectComputed(
      $include('customer -> prod.eu', {where: 'tag is #next'})
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [],
        "edges": [],
      }
    `)
  })
})
