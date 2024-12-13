import { describe, expect, it } from 'vitest'
import type { DeploymentViewRuleBuilderOp } from '../../../builder/Builder.view'
import { $exclude, $include, computeNodesAndEdges, type Types } from './fixture'

function expectComputed(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  return expect(computeNodesAndEdges(...rules))
}

describe('Exclude RelationExpr', () => {
  it('should exclude inout', () => {
    expectComputed(
      $include('customer'),
      $include('prod.eu.**'),
      $exclude({
        inout: {
          ref: {
            model: 'cloud.backend.api'
          }
        }
      })
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu.db",
          "prod.eu.zone1",
          "prod.eu.zone2",
          "prod.eu.zone1.api",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.api",
          "prod.eu.zone2.ui",
          "prod.eu.auth",
          "prod.eu.media",
        ],
        "edges": [
          "prod.eu.zone1.ui:prod.eu.auth",
          "prod.eu.zone1.ui:prod.eu.media",
          "prod.eu.zone2.ui:prod.eu.auth",
          "prod.eu.zone2.ui:prod.eu.media",
          "customer:prod.eu.zone1.ui",
          "customer:prod.eu.zone2.ui",
        ],
      }
    `)
  })

  it('should exclude incoming', () => {
    expectComputed(
      $include('customer'),
      $include('prod.eu.**'),
      $exclude({
        incoming: {
          ref: {
            model: 'cloud.backend.api'
          }
        }
      }),
      $exclude({
        incoming: {
          ref: {
            model: 'cloud.auth'
          }
        }
      }),
      $exclude({
        incoming: {
          ref: {
            model: 'cloud.media'
          }
        }
      })
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu.auth",
          "prod.eu.media",
          "prod.eu.zone1",
          "prod.eu.zone2",
          "prod.eu.zone1.api",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.api",
          "prod.eu.zone2.ui",
          "prod.eu.db",
        ],
        "edges": [
          "prod.eu.zone1.api:prod.eu.db",
          "prod.eu.zone2.api:prod.eu.db",
          "customer:prod.eu.zone1.ui",
          "customer:prod.eu.zone2.ui",
        ],
      }
    `)
  })

  it('should exclude outgoing', () => {
    expectComputed(
      $include('customer'),
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2.*'),
      $exclude({
        outgoing: {
          ref: {
            model: 'cloud.frontend'
          }
        }
      }),
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu.zone1",
          "prod.eu.zone2",
          "prod.eu.zone1.api",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.api",
          "prod.eu.zone2.ui",
        ],
        "edges": [
          "customer:prod.eu.zone1.ui",
          "customer:prod.eu.zone2.ui",
        ],
      }
    `)
  })
})
