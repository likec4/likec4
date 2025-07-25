import { Builder } from '@likec4/core/builder'
import { LikeC4Model } from '@likec4/core/model'
import { describe, it } from 'vitest'
import { type RelationshipDetailsViewData, computeRelationshipDetailsViewData } from '../compute.deployment'
import { $include, computeRelationshipDetails } from './fixture'

describe('computeEdgeDetailsViewData', () => {
  describe('deployment realtion', () => {
    describe('adds node as source/target if', () => {
      const result = computeRelationshipDetails(
        'customer',
        'prod.eu',
        $include('prod.*'),
        $include('customer'),
      )

      it('it is the endpoint', ({ expect }) => {
        expect(result.sourceIds).toContain('customer')
        expect(result.targetIds).toContain('prod.eu.zone1.api')
      })
      it('it is ancestor of the endpoint and is not shown on current view', ({ expect }) => {
        expect(result.targetIds).toContain('prod.eu.zone1')
      })
      it('it is ancestor of the endpoint and is a leaf node on current view', ({ expect }) => {
        expect(result.targetIds).toContain('prod.eu')
      })
    })
  })

  describe.only('model relation', () => {
    const result = computeRelationshipDetails(
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api',
      $include('prod.*'),
    )

    describe('adds node as source/target if', () => {
      it('it is an instance of the endpoint', ({ expect }) => {
        expect(result.sourceIds).toContain('prod.eu.zone1.ui')
        expect(result.targetIds).toContain('prod.eu.zone1.api')
      })
      it('it is an instance of the endpoint\'s ancestor', ({ expect }) => {
        const result = computeRelationshipDetails(
          'dev.devCustomer',
          'dev.devCloud',
          $include('dev.*'),
        )

        expect(result.sourceIds).toContain('dev.devCustomer')
        expect(result.targetIds).toContain('dev.devCloud')
      })
      it.only('it is a deployment node and ancestor of the instance of the endpoint and is not shown on current view', ({ expect }) => {
        const result = computeRelationshipDetails(
          'global.email',
          'prod.eu',
          $include('prod.*'),
          $include('global.*'),
        )

        expect(result.targetIds).toContain('prod.eu.zone1')
      })
      it('it is a deployment node and ancestor of the instance of the endpoint and is leaf node on current view', ({ expect }) => {
      })
    })
  })
})
