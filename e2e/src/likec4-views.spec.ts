import { expect, test } from 'vitest'
import { likec4model } from './likec4-views'

test('Generated model from views has expected element ids', () => {
  expect([...likec4model.elements()].map(e => e.id)).to.have.same.members([
    'amazon',
    'cloud',
    'customer',
    'amazon.lambdas',
    'amazon.rds',
    'amazon.sqs',
    'cloud.legacy',
    'cloud.next',
    'cloud.supportUser',
    'cloud.ui',
    'amazon.lambdas.fn_enrich',
    'amazon.rds.aurora',
    'amazon.rds.pg',
    'amazon.sqs.queue1',
    'amazon.sqs.queue2',
    'amazon.s3',
    'amazon.s3.bucket1',
    'amazon.s3.bucket2',
    'cloud.legacy.backend',
    'cloud.next.backend',
    'cloud.next.events',
    'cloud.next.graphql',
    'cloud.ui.dashboard',
    'cloud.ui.mobile',
    'cloud.ui.supportPanel',
    'amazon.rds.aurora.tblUsers',
    'amazon.rds.pg.tblUsers',
    'cloud.legacy.backend.services',
    'cloud.next.graphql.myAccount',
    'cloud.next.graphql.updateAccount',
  ])
})
test('Generated model from views has expected deployment ids', () => {
  expect([...likec4model.deployment.elements()].map(e => e.id)).to.have.same.members([
    'customernd',
    'prod',
    'customernd.customer',
    'prod.eu',
    'prod.us',
    'prod.eu.backend',
    'prod.eu.zone1',
    'prod.eu.zone2',
    'prod.us.backend',
    'prod.us.zone1',
    'prod.us.zone2',
    'prod.eu.zone1.ui',
    'prod.eu.zone1.graphql',
    'prod.eu.zone2.ui',
    'prod.eu.zone2.graphql',
    'prod.us.zone1.ui',
    'prod.us.zone1.graphql',
    'prod.us.zone2.ui',
    'prod.us.zone2.graphql',
  ])
})
test('Generated model from views has expected view ids', () => {
  expect([...likec4model.views()].map(v => v.id)).to.have.same.members([
    'amazon',
    'amazon_lambdas',
    'amazon_rds',
    'amazon_sqs',
    'amazon_s3',
    'backend',
    'cloud',
    'cloud_legacy',
    'cloud_legacy_backend',
    'cloud_next',
    'cloud_ui',
    'cloud_ui_dashboard',
    'cloud_ui_supportPanel',
    'cloud-to-amazon',
    'customer',
    'deploy_1',
    'dynamic-view-1',
    'graphql',
    'index',
    'mobile',
    'multiple-expanded',
    'multiple-merged',
    'view-with-custom-colors',
  ])
})

test('multiple-expanded view has separate edges for async relationships', () => {
  const view = likec4model.view('multiple-expanded')
  expect(view.$view.edges).toHaveLength(3)
  const expanded = view.$view.edges.filter(e => e.label !== '[...]')
  expect(expanded.map(e => e.label).sort()).toEqual(['Mutation', 'Query'])
  for (const edge of expanded) {
    expect(edge.relations).toHaveLength(1)
  }
  const merged = view.$view.edges.find(e => e.label === '[...]')!
  expect(merged.relations).toHaveLength(2)
})

test('multiple-merged view has a single merged edge despite async specs', () => {
  const view = likec4model.view('multiple-merged')
  expect(view.$view.edges).toHaveLength(1)
  expect(view.$view.edges[0]!.label).toBe('[...]')
  expect(view.$view.edges[0]!.relations).toHaveLength(4)
})
