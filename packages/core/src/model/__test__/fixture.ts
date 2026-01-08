import { Builder } from '../../builder/Builder'
import { computeParsedModelData } from '../../compute-view/compute-view'
import { LikeC4Model } from '../LikeC4Model'

const {
  builder: b,
  model: {
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
      tags: ['internal'],
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
  relationships: {
    req: {
      technology: 'HTTP',
    },
  },
  tags: {
    internal: {},
    external: {},
    tag1: {},
    tag2: {},
  },
  deployments: {
    env: {},
    zone: {},
    node: {},
  },
})

const local = b
  .with(
    $m.model(
      person('customer'),
      system('cloud').with(
        component('frontend').with(
          webapp('dashboard', {
            tags: ['tag1'],
          }),
          mobile('mobile'),
        ),
        component('auth'),
        component('backend').with(
          component('api'),
          component('graphql'),
        ),
        component('media', {
          tags: ['tag2'],
          shape: 'storage',
        }),
      ),
      system('aws').with(
        component('rds', {
          tags: ['tag2'],
          shape: 'storage',
        }),
        component('s3', {
          tags: ['tag2'],
          shape: 'storage',
        }),
      ),
      system('email', {
        tags: ['external'],
      }),
    ),
    $m.model(
      $m.rel('customer', 'cloud', 'uses services'),
      $m.rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
      $m.rel('customer', 'cloud.frontend.dashboard', 'opens in browser'),
      $m.rel('cloud.frontend.dashboard', 'cloud.auth', 'authenticates'),
      $m.rel('cloud.frontend.dashboard', 'cloud.backend.api', {
        title: 'fetches data',
        kind: 'req',
      }),
      $m.rel('cloud.frontend.dashboard', 'cloud.media', 'fetches media'),
      $m.rel('cloud.frontend.mobile', 'cloud.auth', 'authenticates'),
      $m.rel('cloud.frontend.mobile', 'cloud.backend.api', {
        title: 'fetches data',
        technology: 'GRPC',
        kind: 'req',
      }),
      $m.rel('cloud.frontend.mobile', 'cloud.media', 'fetches media'),
      $m.rel('cloud.frontend', 'cloud.backend'),
    ),
    $m.model(
      $m.rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
      $m.rel('cloud.backend.api', 'cloud.media', 'uploads media'),
      $m.rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      $m.rel('cloud.backend.api', 'email', 'sends emails'),
      $m.rel('cloud', 'email', 'uses'),
      $m.rel('cloud.media', 'aws.s3', 'uploads'),
      $m.rel('email', 'customer', 'sends emails'),
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
      deploymentView('prod').with(
        $include('customer.instance'),
        $include('prod.eu.zone1.ui'),
      ),
    ),
  )

export const builder = local.clone()

export const parsed = local.build()
export type TestFqn = typeof local.Types.Fqn

export const computed = computeParsedModelData(parsed)

export const model = LikeC4Model.create(computed)
