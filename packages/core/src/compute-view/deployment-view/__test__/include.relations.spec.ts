import { describe, expect, it } from 'vitest'
import type { DeploymentViewRuleBuilderOp } from '../../../builder/Builder.view'
import { $include, computeNodesAndEdges, type Types } from './fixture'

function expectComputed(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  return expect(computeNodesAndEdges(...rules))
}

describe('DirectRelationPredicate', () => {
  it('should include with all wildcards', () => {
    expectComputed(
      $include('* -> *')
      // $exclude('prod.eu.auth')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer.instance",
          "acc.eu.ui",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.ui",
          "prod.us.zone1.ui",
          "acc.eu.api",
          "prod.eu.zone1.api",
          "prod.eu.zone2.api",
          "prod.us.zone1.api",
          "acc.eu.auth",
          "acc.eu.db",
          "prod.eu.auth",
          "prod.eu.media",
          "prod.eu.db",
          "global.email",
          "prod.us.db",
          "acc.testCustomer.instance",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "customer.instance:prod.eu.zone2.ui",
          "customer.instance:prod.us.zone1.ui",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.auth",
          "prod.eu.zone1.ui:prod.eu.media",
          "prod.eu.zone2.ui:prod.eu.auth",
          "prod.eu.zone2.ui:prod.eu.media",
          "prod.eu.zone2.ui:prod.eu.zone2.api",
          "prod.us.zone1.ui:prod.us.zone1.api",
          "acc.eu.ui:acc.eu.auth",
          "acc.eu.ui:acc.eu.api",
          "prod.eu.zone1.api:prod.eu.auth",
          "prod.eu.zone1.api:prod.eu.media",
          "prod.eu.zone1.api:prod.eu.db",
          "prod.eu.zone1.api:global.email",
          "prod.eu.db:prod.us.db",
          "global.email:customer.instance",
          "global.email:acc.testCustomer.instance",
          "prod.eu.zone2.api:prod.eu.auth",
          "prod.eu.zone2.api:prod.eu.media",
          "prod.eu.zone2.api:prod.eu.db",
          "prod.eu.zone2.api:global.email",
          "prod.us.zone1.api:prod.us.db",
          "prod.us.zone1.api:global.email",
          "acc.eu.api:acc.eu.auth",
          "acc.eu.api:acc.eu.db",
          "acc.eu.api:global.email",
          "acc.testCustomer.instance:acc.eu.ui",
        ],
      }
    `)
  })

  it('should include direct relation', () => {
    expectComputed(
      $include('customer -> prod.eu')
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

    expectComputed(
      $include('customer -> *')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
        ],
        "edges": [
          "customer:prod",
        ],
      }
    `)
  })

  it('should include direct relations with instances and wildcards', () => {
    // because predicate includes instance - we add "siblings" node for better result
    expectComputed(
      $include('customer.instance -> *')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer.instance",
          "prod",
        ],
        "edges": [
          "customer.instance:prod",
        ],
      }
    `)

    expectComputed(
      $include('* <-> prod')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
          "global",
        ],
        "edges": [
          "customer:prod",
          "prod:global",
        ],
      }
    `)

    // because predicate includes instance
    // we flatten nodes that contain only one instance (customer -> customer.instance)
    expectComputed(
      $include('* <-> prod.eu.zone1.ui')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer.instance",
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.auth",
          "prod.eu.media",
        ],
        "edges": [
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.auth",
          "prod.eu.zone1.ui:prod.eu.media",
          "customer.instance:prod.eu.zone1.ui",
        ],
      }
    `)
  })

  it('should include direct relations with expand predicate', () => {
    expectComputed(
      $include('customer'), // should be visible, but has no connections
      $include('prod.eu.zone1._ <-> prod.eu.zone2._')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu.zone2.ui",
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.zone2.api",
        ],
        "edges": [
          "prod.eu.zone2.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.zone2.api",
        ],
      }
    `)

    expectComputed(
      $include('customer -> prod.eu._')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu",
          "prod.eu.zone1",
          "prod.eu.zone2",
        ],
        "edges": [
          "customer:prod.eu.zone1",
          "customer:prod.eu.zone2",
        ],
      }
    `)

    expectComputed(
      $include('customer'),
      $include('prod.eu.zone1._ <-> prod.eu.zone2._'),
      $include('prod.eu.zone2._') // Because we included this, previous connections cleaned as cross-boundary
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod.eu.zone2",
          "prod.eu.zone2.ui",
          "prod.eu.zone2.api",
        ],
        "edges": [
          "prod.eu.zone2.ui:prod.eu.zone2.api",
          "customer:prod.eu.zone2.ui",
        ],
      }
    `)
  })
})
