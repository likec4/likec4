import type { DiagramView, LayoutedView, LikeC4ViewModel, ViewId } from 'likec4/model'
import { expectTypeOf, test } from 'vitest'
import {
  type useLikeC4Model,
  type useLikeC4View,
  likec4model,
  LikeC4View,
  LikeC4ViewProps,
  ReactLikeC4,
  ReactLikeC4Props,
} from './likec4-views'

test('LikeC4Model in React types codegen', () => {
  expectTypeOf(likec4model.stage).toEqualTypeOf<'layouted'>()
  type A = typeof likec4model.Aux
  expectTypeOf<A['ElementId']>().toEqualTypeOf<
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
    | 'cloud.next.graphql.updateAccount'
  >()

  expectTypeOf<A['DeploymentId']>().toEqualTypeOf<
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
    | 'prod.us.zone2.ui'
  >()

  type ExpectedViewId =
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
    | 'view-with-custom-colors'

  expectTypeOf<A['ViewId']>().toEqualTypeOf<ExpectedViewId>()
  expectTypeOf(likec4model.view('backend')).toEqualTypeOf<LikeC4ViewModel<A, LayoutedView<A>>>()
  expectTypeOf(likec4model.view).parameter(0).toEqualTypeOf<ExpectedViewId | { id: ViewId<ExpectedViewId> }>()

  // @ts-expect-error
  likec4model.element('amazon1')
})

test('ReactComponents with valid types', () => {
  expectTypeOf<typeof LikeC4View>().parameter(0).toExtend<{
    viewId: typeof likec4model.Aux.ViewId
  }>()

  expectTypeOf<LikeC4ViewProps>().toExtend<{
    viewId: typeof likec4model.Aux.ViewId
  }>()

  expectTypeOf<typeof ReactLikeC4>().parameter(0).toExtend<{
    viewId: typeof likec4model.Aux.ViewId
  }>()

  expectTypeOf<ReactLikeC4Props>().toExtend<{
    viewId: typeof likec4model.Aux.ViewId
  }>()
})

test('useLikeC4Model with valid types', () => {
  expectTypeOf<typeof useLikeC4Model>().returns.toEqualTypeOf<typeof likec4model>()
})

test('useLikeC4View with valid types', () => {
  expectTypeOf<typeof useLikeC4View>().parameter(0).toEqualTypeOf<typeof likec4model.Aux.ViewId>()
  expectTypeOf<typeof useLikeC4View>().returns.toEqualTypeOf<DiagramView<typeof likec4model.Aux>>()
})
