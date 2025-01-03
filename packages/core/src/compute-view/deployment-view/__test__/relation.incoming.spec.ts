import { describe, expect, it } from 'vitest'
import type { DeploymentRulesBuilderOp } from '../../../builder'
import { type Types, $exclude, $include, computeNodesAndEdges } from './fixture'

function expectComputed(...rules: DeploymentRulesBuilderOp<Types>[]) {
  return expect(computeNodesAndEdges(...rules))
}

describe('IncommingRelationPredicate', () => {
  it('should include relation incoming to deployment node if it matches condition', () => {
    expectComputed(
      $include('customer'),
      $include('-> prod.eu.zone1.ui', { where: 'tag is #old' }),
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
          "prod",
          "prod.eu.zone1.ui",
        ],
        "edges": [
          "customer:prod.eu.zone1.ui",
        ],
      }
    `)
  })

  it('should not include relation incoming to deployment node if it does not match condition', () => {
    expectComputed(
      $include('customer'),
      $include('-> prod.eu.zone1.ui', { where: 'tag is #next' }),
    ).toMatchInlineSnapshot(`
      {
        "Nodes": [
          "customer",
        ],
        "edges": [],
      }
    `)
  })

  it('should exclude relation incoming to model element if it matches condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude({
        incoming: {
          ref: {
            model: 'cloud.backend',
          },
        },
      }, { where: 'tag is #old' }),
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.api',
        'prod.eu.zone1.ui',
        'prod.eu.db',
        'prod.eu.auth',
        'prod.eu.media',
      ],
      edges: [
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media',
      ],
    })
  })

  it('should not exclude relation incoming to model element if it does not match condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude({
        incoming: {
          ref: {
            model: 'cloud.backend',
          },
        },
      }, { where: 'tag is #next' }),
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.ui',
        'prod.eu.zone1.api',
        'prod.eu.auth',
        'prod.eu.media',
        'prod.eu.db',
      ],
      edges: [
        'prod.eu.zone1.ui:prod.eu.zone1.api',
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media',
      ],
    })
  })

  it('should exclude relation incoming to deployment node if it matches condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude('-> prod.eu.zone1.*', { where: 'tag is #old' }),
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.api',
        'prod.eu.zone1.ui',
        'prod.eu.db',
        'prod.eu.auth',
        'prod.eu.media',
      ],
      edges: [
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media',
      ],
    })
  })

  it('should not exclude relation incoming to deployment node if it does not match condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude('-> prod.eu.zone1.*', { where: 'tag is #next' }),
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.ui',
        'prod.eu.zone1.api',
        'prod.eu.auth',
        'prod.eu.media',
        'prod.eu.db',
      ],
      edges: [
        'prod.eu.zone1.ui:prod.eu.zone1.api',
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media',
      ],
    })
  })
})
