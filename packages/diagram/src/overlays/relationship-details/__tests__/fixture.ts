import type { DeploymentRulesBuilderOp } from '@likec4/core/builder'
import { Builder } from '@likec4/core/builder'
import { LikeC4Model } from '@likec4/core/model'
import { map, prop } from 'remeda'
import { computeRelationshipDetailsViewData } from '../compute.deployment'

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
    views,
    deploymentView,
    $rules,
    $include,
    $exclude,
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
  deployments: {
    env: {},
    zone: {},
    node: {},
  },
  tags: {
    old: {
      color: 'red',
    },
    next: {
      color: 'green',
    },
    temp: {
      color: 'blue',
    },
  },
  relationships: { 'https': {} },
})

export const builder = b
  .with(
    model(
      person('customer', {
        title: 'Happy Customer',
      }),
      system('cloud').with(
        component('frontend').with(
          webapp('dashboard', {
            title: 'Dashboard',
          }),
          mobile('mobile', {
            title: 'Mobile',
          }),
        ),
        component('auth'),
        component('backend').with(
          component('api'),
        ),
        component('media', {
          shape: 'storage',
        }),
      ),
      system('aws').with(
        component('rds', {
          shape: 'storage',
        }),
        component('s3', {
          shape: 'storage',
        }),
      ),
      system('email'),
    ),
    model(
      // $m.rel('customer', 'cloud', 'uses services'),
      $m.rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
      $m.rel('customer', 'cloud.frontend.dashboard', {
        title: 'opens in browser',
        tags: ['old'],
      }),
      $m.rel('cloud.frontend.dashboard', 'cloud.auth', {
        title: 'authenticates',
        color: 'green',
      }),
      $m.rel('cloud.frontend.dashboard', 'cloud.backend.api', {
        title: 'fetches data',
        tags: ['old'],
      }),
      $m.rel('cloud.frontend.dashboard', 'cloud.media', {
        title: 'fetches media',
        tags: ['temp'],
      }),
      $m.rel('cloud.frontend.mobile', 'cloud.auth', {
        title: 'authenticates',
        color: 'amber',
      }),
      $m.rel('cloud.frontend.mobile', 'cloud.backend.api', 'fetches data'),
      $m.rel('cloud.frontend.mobile', 'cloud.media', 'fetches media'),
      $m.rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
      $m.rel('cloud.backend.api', 'cloud.media', 'uploads media'),
      $m.rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      $m.rel('cloud.backend.api', 'email', 'sends emails'),
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
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard', {
              title: 'prod.eu.zone1/dashboard',
            }),
          ),
          zone('zone2').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard', {
              title: 'prod.eu.zone2/dashboard',
            }),
          ),
          instanceOf('auth', 'cloud.auth'),
          instanceOf('media', 'cloud.media'),
          instanceOf('db', 'aws.rds'),
        ),
        zone('us').with(
          zone('zone1').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard', {
              title: 'prod.us.zone1/dashboard',
            }),
          ),
          instanceOf('db', 'aws.rds'),
        ),
      ),
      env('dev').with(
        node('devCustomer').with(
          instanceOf('instance', 'customer'),
        ),
        node('devCloud').with(
          instanceOf('instance', 'cloud'),
        ),
      ),
      env('acc').with(
        node('testCustomer').with(
          instanceOf('instance', 'customer'),
        ),
        zone('eu').with(
          instanceOf('api', 'cloud.backend.api'),
          instanceOf('ui', 'cloud.frontend.dashboard'),
          instanceOf('auth', 'cloud.auth'),
          instanceOf('db', 'aws.rds'),
        ),
      ),
      env('global').with(
        instanceOf('email', 'email'),
      ),
      $d.rel('prod.eu.db', 'prod.us.db', {
        title: 'replicates',
        color: 'green',
      }),
      $d.rel('prod.us.db', 'prod.eu.db', {
        title: 'replicates',
        color: 'amber',
      }),
      $d.rel('customer', 'prod.eu.zone1.api', {
        title: 'uses api',
      }),
      $d.rel('customer', 'prod.eu.zone2.api', {
        title: 'uses api',
      }),
    ),
  )
  .clone()

export type Types = typeof builder['Types']

export { $exclude, $include }

export function computeRelationshipDetails(
  source: Types['DeploymentFqn'],
  target: Types['DeploymentFqn'],
  ...rules: DeploymentRulesBuilderOp<Types>[]
) {
  const modelsource = builder.clone()
    .with(
      views(
        deploymentView('index', $rules(...rules)),
      ),
    ).build()

  const model = LikeC4Model.fromParsed(modelsource)
  const data = computeRelationshipDetailsViewData({
    source: model.deployment.findElement(source)!,
    target: model.deployment.findElement(target)!,
  })

  return Object.assign(data, {
    sourceIds: map([...data.sources], prop('id')) as string[],
    targetIds: map([...data.targets], prop('id')) as string[],
  })
}
