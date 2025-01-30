import { expectTypeOf, test } from 'vitest'
import { likeC4Model } from './likec4-model'
import { likeC4Model as likeC4ModelFromViews } from './likec4-views'

test('Model Codegen with valid types', () => {
  const m = likeC4Model

  expectTypeOf(m.Aux.Element).toEqualTypeOf(
    '' as
      | 'amazon'
      | 'cloud'
      | 'customer'
      | 'amazon.lambdas'
      | 'amazon.rds'
      | 'amazon.sqs'
      | 'cloud.legacy'
      | 'cloud.next'
      | 'cloud.supportUser'
      | 'cloud.ui'
      | 'amazon.lambdas.fn_enrich'
      | 'amazon.rds.aurora'
      | 'amazon.rds.pg'
      | 'amazon.sqs.queue1'
      | 'amazon.sqs.queue2'
      | 'cloud.legacy.backend'
      | 'cloud.next.backend'
      | 'cloud.next.events'
      | 'cloud.next.graphql'
      | 'cloud.ui.dashboard'
      | 'cloud.ui.mobile'
      | 'cloud.ui.supportPanel'
      | 'amazon.rds.aurora.tblUsers'
      | 'amazon.rds.pg.tblUsers'
      | 'cloud.legacy.backend.services'
      | 'cloud.next.graphql.myAccount'
      | 'cloud.next.graphql.updateAccount',
  )

  expectTypeOf(m.Aux.Deployment).toEqualTypeOf(
    '' as
      | 'customernd'
      | 'prod'
      | 'customernd.customer'
      | 'prod.eu'
      | 'prod.us'
      | 'prod.eu.backend'
      | 'prod.eu.zone1'
      | 'prod.eu.zone2'
      | 'prod.us.backend'
      | 'prod.us.zone1'
      | 'prod.us.zone2'
      | 'prod.eu.zone1.graphql'
      | 'prod.eu.zone1.ui'
      | 'prod.eu.zone2.graphql'
      | 'prod.eu.zone2.ui'
      | 'prod.us.zone1.graphql'
      | 'prod.us.zone1.ui'
      | 'prod.us.zone2.graphql'
      | 'prod.us.zone2.ui',
  )

  expectTypeOf(m.Aux.View).toEqualTypeOf(
    '' as
      | 'amazon'
      | 'amazon_lambdas'
      | 'amazon_rds'
      | 'amazon_sqs'
      | 'backend'
      | 'cloud'
      | 'cloud_legacy'
      | 'cloud_legacy_backend'
      | 'cloud_next'
      | 'cloud_ui'
      | 'cloud_ui_dashboard'
      | 'cloud_ui_supportPanel'
      | 'cloud-to-amazon'
      | 'customer'
      | 'deploy_1'
      | 'dynamic-view-1'
      | 'graphql'
      | 'index'
      | 'mobile'
      | 'view-with-custom-colors',
  )
})

test('Views Codegen with valid types', () => {
  const m = likeC4ModelFromViews

  expectTypeOf(m.Aux.Element).toEqualTypeOf(
    '' as
      | 'amazon'
      | 'cloud'
      | 'customer'
      | 'amazon.lambdas'
      | 'amazon.rds'
      | 'amazon.sqs'
      | 'cloud.legacy'
      | 'cloud.next'
      | 'cloud.supportUser'
      | 'cloud.ui'
      | 'amazon.lambdas.fn_enrich'
      | 'amazon.rds.aurora'
      | 'amazon.rds.pg'
      | 'amazon.sqs.queue1'
      | 'amazon.sqs.queue2'
      | 'cloud.legacy.backend'
      | 'cloud.next.backend'
      | 'cloud.next.events'
      | 'cloud.next.graphql'
      | 'cloud.ui.dashboard'
      | 'cloud.ui.mobile'
      | 'cloud.ui.supportPanel'
      | 'amazon.rds.aurora.tblUsers'
      | 'amazon.rds.pg.tblUsers'
      | 'cloud.legacy.backend.services'
      | 'cloud.next.graphql.myAccount'
      | 'cloud.next.graphql.updateAccount',
  )

  expectTypeOf(m.Aux.Deployment).toEqualTypeOf(
    '' as
      | 'customernd'
      | 'prod'
      | 'customernd.customer'
      | 'prod.eu'
      | 'prod.us'
      | 'prod.eu.backend'
      | 'prod.eu.zone1'
      | 'prod.eu.zone2'
      | 'prod.us.backend'
      | 'prod.us.zone1'
      | 'prod.us.zone2'
      | 'prod.eu.zone1.graphql'
      | 'prod.eu.zone1.ui'
      | 'prod.eu.zone2.graphql'
      | 'prod.eu.zone2.ui'
      | 'prod.us.zone1.graphql'
      | 'prod.us.zone1.ui'
      | 'prod.us.zone2.graphql'
      | 'prod.us.zone2.ui',
  )

  expectTypeOf(m.Aux.View).toEqualTypeOf(
    '' as
      | 'amazon'
      | 'amazon_lambdas'
      | 'amazon_rds'
      | 'amazon_sqs'
      | 'backend'
      | 'cloud'
      | 'cloud_legacy'
      | 'cloud_legacy_backend'
      | 'cloud_next'
      | 'cloud_ui'
      | 'cloud_ui_dashboard'
      | 'cloud_ui_supportPanel'
      | 'cloud-to-amazon'
      | 'customer'
      | 'deploy_1'
      | 'dynamic-view-1'
      | 'graphql'
      | 'index'
      | 'mobile'
      | 'view-with-custom-colors',
  )
})
