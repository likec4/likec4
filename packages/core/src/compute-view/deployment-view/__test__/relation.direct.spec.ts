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

  it('should exclude direct relation if it matches condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude({
        source: {
          ref: {
            model: 'cloud.frontend'
          },
          selector: 'children'
        },
        target: {
          ref: {
            model: 'cloud.backend'
          }
        }
      }, {where: 'tag is #old'})
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.api',
        'prod.eu.zone1.ui',
        'prod.eu.db',
        'prod.eu.auth',
        'prod.eu.media'
      ],
      edges: [
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media'
      ]
    })
  })  

  it('should not exclude direct relation if it does not match condition', () => {
    expectComputed(
      $include('prod.eu.*'),
      $include('prod.eu.zone1.**'),
      $exclude('prod.eu.zone2'),
      $exclude({
        source: {
          ref: {
            model: 'cloud.frontend'
          },
          selector: 'children'
        },
        target: {
          ref: {
            model: 'cloud.backend'
          }
        }
      }, {where: 'tag is #next'})
    ).toEqual({
      Nodes: [
        'prod.eu.zone1',
        'prod.eu.zone1.ui',
        'prod.eu.zone1.api',
        'prod.eu.auth',
        'prod.eu.media',
        'prod.eu.db'
      ],
      edges: [
        'prod.eu.zone1.ui:prod.eu.zone1.api',
        'prod.eu.zone1.api:prod.eu.auth',
        'prod.eu.zone1.api:prod.eu.media',
        'prod.eu.zone1.api:prod.eu.db',
        'prod.eu.zone1.ui:prod.eu.auth',
        'prod.eu.zone1.ui:prod.eu.media'
      ]
    })
  })
})
