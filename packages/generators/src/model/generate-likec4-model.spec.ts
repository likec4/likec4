import { Builder } from '@likec4/core/builder'
import { computeParsedModelData, viewsWithReadableEdges } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import { describe, it } from 'vitest'
import { generateLikeC4Model } from './generate-likec4-model'

const {
  builder: b,
  model: {
    model,
    person,
    system,
    component,
    webapp,
    mobile,
    ...$m
  },
  deployment: {
    deployment,
    env,
    node,
    zone,
    instanceOf,
    ...$d
  },
  views: {
    view,
    views,
    viewOf,
    deploymentView,
    $rules,
    $include,
  },
} = Builder.forSpecification({
  elements: {
    person: {
      style: {
        shape: 'person',
      },
    },
    system: {},
    component: {},
    webapp: {
      style: {
        shape: 'browser',
      },
    },
    mobile: {
      style: {
        shape: 'mobile',
      },
    },
  },
  tags: {
    internal: {},
    external: {},
  },
  metadataKeys: ['key1'],
  deployments: {
    env: {},
    zone: {},
    node: {},
  },
})

const builder = b
  .with(
    model(
      person('customer'),
      system('cloud').with(
        component('frontend').with(
          webapp('dashboard'),
          mobile('mobile'),
        ),
        component('auth'),
        component('backend', {
          metadata: {
            key1: 'value1',
          },
          tags: ['external'],
        }).with(
          component('api'),
          component('graphql'),
        ),
        component('media', {
          tags: ['internal'],
          shape: 'storage',
        }),
      ),
      system('aws').with(
        component('rds', {
          shape: 'storage',
        }),
        component('s3', {
          metadata: {
            key1: 'value2',
          },
          shape: 'storage',
        }),
      ),
      system('email'),
    ),
    model(
      $m.rel('customer', 'cloud', 'uses services'),
      $m.rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
      $m.rel('customer', 'cloud.frontend.dashboard', 'opens in browser'),
      $m.rel('cloud.frontend.dashboard', 'cloud.auth', 'authenticates'),
      $m.rel('cloud.frontend.dashboard', 'cloud.backend.api', 'fetches data'),
      $m.rel('cloud.frontend.dashboard', 'cloud.media', 'fetches media'),
      $m.rel('cloud.frontend.mobile', 'cloud.auth', 'authenticates'),
      $m.rel('cloud.frontend.mobile', 'cloud.backend.api', 'fetches data'),
      $m.rel('cloud.frontend.mobile', 'cloud.media', 'fetches media'),
      $m.rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
      $m.rel('cloud.backend.api', 'cloud.media', 'uploads media'),
      $m.rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      $m.rel('cloud.backend.api', 'email', 'sends emails'),
      $m.rel('cloud.media', 'aws.s3', 'uploads'),
      $m.rel('email', 'customer', {
        tags: ['external'],
        title: 'sends emails',
        metadata: {
          key1: 'value3',
        },
      }),
    ),
    deployment(
      node('customer').with(
        instanceOf('instance', 'customer'),
      ),
      env('prod').with(
        zone('eu').with(
          zone('zone1').with(
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api'),
          ),
          zone('zone2').with(
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api'),
          ),
          instanceOf('media', 'cloud.media'),
          instanceOf('db', 'aws.rds'),
        ),
        zone('us').with(
          instanceOf('db', 'aws.rds'),
        ),
      ),
      $d.rel('prod.eu.db', 'prod.us.db', 'replicates'),
    ),
    views(
      view('index', $include('*')),
      viewOf(
        'cloud',
        'cloud',
        $rules(
          $include('*'),
          $include('cloud.frontend.dashboard'),
        ),
      ),
      deploymentView(
        'prod',
        'prod',
        $rules(
          $include('customer.instance'),
          $include('prod.eu.zone1.ui'),
        ),
      ),
    ),
  )

describe('generateLikeC4Model', () => {
  it('parsed-model', async ({ expect }) => {
    const parsed = builder.build()
    const m = LikeC4Model.create(parsed)
    await expect(generateLikeC4Model(m)).toMatchFileSnapshot('__snapshots__/likec4.parsed-model.snap')
  })

  it('computed-model', async ({ expect }) => {
    const computed = viewsWithReadableEdges(computeParsedModelData(builder.build()))
    const m = LikeC4Model.create(computed)
    await expect(generateLikeC4Model(m)).toMatchFileSnapshot('__snapshots__/likec4.computed-model.snap')
  })

  it('computed-model with core package', async ({ expect }) => {
    const computed = viewsWithReadableEdges(computeParsedModelData(builder.build()))
    const m = LikeC4Model.create(computed)
    await expect(generateLikeC4Model(m, { useCorePackage: true })).toMatchFileSnapshot(
      '__snapshots__/likec4.computed-model-with-core.snap',
    )
  })
})
