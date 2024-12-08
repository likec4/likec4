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
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer.instance",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.ui",
          "prod.us.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.zone2.api",
          "prod.us.zone1.api",
          "prod.eu.media",
          "prod.eu.db",
          "global.email",
          "prod.us.db",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "customer.instance:prod.eu.zone2.ui",
          "customer.instance:prod.us.zone1.ui",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.media",
          "prod.eu.zone2.ui:prod.eu.media",
          "prod.eu.zone2.ui:prod.eu.zone2.api",
          "prod.us.zone1.ui:prod.us.zone1.api",
          "prod.eu.zone1.api:prod.eu.media",
          "prod.eu.zone1.api:prod.eu.db",
          "prod.eu.zone1.api:global.email",
          "prod.eu.db:prod.us.db",
          "global.email:customer.instance",
          "prod.eu.zone2.api:prod.eu.media",
          "prod.eu.zone2.api:prod.eu.db",
          "prod.eu.zone2.api:global.email",
          "prod.us.zone1.api:prod.us.db",
          "prod.us.zone1.api:global.email",
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
          "prod.eu.zone1.ui",
          "prod.eu.zone2.ui",
          "prod.us.zone1.ui",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "customer.instance:prod.eu.zone2.ui",
          "customer.instance:prod.us.zone1.ui",
        ],
      }
    `)

    expectComputed(
      $include('* <-> prod.eu.zone1.ui')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "customer.instance",
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.media",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.media",
        ],
      }
    `)

    expectComputed(
      $include('* <-> prod.eu.zone1.ui')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "customer.instance",
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.media",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.media",
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
