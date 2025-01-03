import { describe, expect, it } from 'vitest'
import type { DeploymentRulesBuilderOp } from '../../../builder'
import { type Types, $include, computeNodesAndEdges } from './fixture'

function expectComputed(...rules: DeploymentRulesBuilderOp<Types>[]) {
  return expect(computeNodesAndEdges(...rules))
}

describe('DirectRelationPredicate', () => {
  it('should include with all wildcards', () => {
    expectComputed(
      $include('* -> *'),
      // $exclude('prod.eu.auth')
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "global.email",
          "customer.instance",
          "dev",
          "acc",
          "prod",
          "prod.eu",
          "prod.eu.zone1",
          "prod.eu.zone2",
          "prod.us",
          "prod.us.zone1",
          "dev.devCustomer.instance",
          "acc.testCustomer.instance",
          "dev.devCloud.instance",
          "acc.eu",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.ui",
          "acc.eu.ui",
          "prod.eu.zone1.api",
          "prod.eu.zone2.api",
          "acc.eu.api",
          "prod.eu.auth",
          "prod.eu.media",
          "prod.eu.db",
          "acc.eu.auth",
          "acc.eu.db",
          "prod.us.zone1.ui",
          "prod.us.zone1.api",
          "prod.us.db",
        ],
        "edges": [
          "customer.instance:prod.eu.zone1.ui",
          "customer.instance:prod.eu.zone2.ui",
          "customer.instance:prod.us.zone1.ui",
          "global.email:customer.instance",
          "prod.eu.zone1.api:prod.eu.auth",
          "prod.eu.zone1.api:prod.eu.media",
          "prod.eu.zone1.api:prod.eu.db",
          "prod.eu.zone1.api:global.email",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.ui:prod.eu.auth",
          "prod.eu.zone1.ui:prod.eu.media",
          "prod.eu.zone2.api:prod.eu.auth",
          "prod.eu.zone2.api:prod.eu.media",
          "prod.eu.zone2.api:prod.eu.db",
          "prod.eu.zone2.api:global.email",
          "prod.eu.zone2.ui:prod.eu.zone2.api",
          "prod.eu.zone2.ui:prod.eu.auth",
          "prod.eu.zone2.ui:prod.eu.media",
          "prod.eu.db:prod.us.db",
          "prod.us.zone1.api:prod.us.db",
          "prod.us.zone1.api:global.email",
          "prod.us.zone1.ui:prod.us.zone1.api",
          "dev.devCustomer.instance:dev.devCloud.instance",
          "global.email:dev.devCustomer.instance",
          "dev.devCloud.instance:global.email",
          "acc.testCustomer.instance:acc.eu.ui",
          "global.email:acc.testCustomer.instance",
          "acc.eu.api:acc.eu.auth",
          "acc.eu.api:acc.eu.db",
          "acc.eu.api:global.email",
          "acc.eu.ui:acc.eu.api",
          "acc.eu.ui:acc.eu.auth",
        ],
      }
    `)
  })

  it('should include direct relation', () => {
    expectComputed(
      $include('customer -> prod.eu'),
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
          "prod.eu",
        ],
        "edges": [
          "customer:prod.eu",
        ],
      }
    `)

    expectComputed(
      $include('customer -> *'),
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
      $include('customer.instance -> *'),
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
      $include('* <-> prod'),
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

    expectComputed(
      $include('* <-> prod.eu.zone1.ui'),
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
          "prod.eu.zone1",
          "prod.eu.zone1.ui",
          "prod.eu.auth",
          "prod.eu.media",
          "prod.eu.zone1.api",
        ],
        "edges": [
          "customer:prod.eu.zone1.ui",
          "prod.eu.zone1.ui:prod.eu.auth",
          "prod.eu.zone1.ui:prod.eu.media",
          "prod.eu.zone1.ui:prod.eu.zone1.api",
        ],
      }
    `)
  })

  it('should include direct relations with expand predicate', () => {
    expectComputed(
      $include('customer'), // should be visible, but has no connections
      $include('prod.eu.zone1._ <-> prod.eu.zone2._'),
    ).toEqual({
      'Nodes': [
        'customer',
        'prod.eu.zone1',
        'prod.eu.zone1.ui',
        'prod.eu.zone2',
        'prod.eu.zone2.api',
      ],
      'edges': [
        'prod.eu.zone1.ui:prod.eu.zone2.api',
      ],
    })

    expectComputed(
      $include('customer -> prod.eu._'),
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
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
      $include('prod.eu.zone2._'), // Because we included this, previous connections cleaned as cross-boundary
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
          "prod.eu.zone2",
          "prod.eu.zone1.ui",
          "prod.eu.zone2.ui",
          "prod.eu.zone2.api",
        ],
        "edges": [
          "customer:prod.eu.zone2.ui",
          "prod.eu.zone2.ui:prod.eu.zone2.api",
        ],
      }
    `)
  })
})
