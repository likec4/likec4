import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import { generateLikeC4 } from './generate-likec4'

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
    $exclude,
    $style,
  },
} = Builder.forSpecification({
  elements: {
    person: {
      style: {
        shape: 'person',
      },
    },
    system: {},
    component: {
      style: {
        shape: 'component',
      },
    },
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
  relationships: {
    async: {
      color: 'amber',
      line: 'dotted',
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
        }),
        component('backend.api'),
        component('backend.graphql'),
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
      $m.rel('cloud.frontend.mobile', 'cloud.backend.api', {
        title: 'fetches data',
        head: 'open',
        description: {
          md: '**Fetches data**\nfrom the backend API',
        },
      }),
      $m.rel('cloud.frontend.mobile', 'cloud.media', 'fetches media'),
      $m.rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
      $m.rel('cloud.backend.api', 'cloud.media', 'uploads media'),
      $m.rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      $m.rel('cloud.backend.api', 'email', {
        kind: 'async',
        title: 'sends emails',
        metadata: {
          key1: ['value2', 'value3'],
        },
      }),
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

describe('generateLikeC4', () => {
  it('generates valid DSL from parsed model data', async ({ expect }) => {
    const parsed = builder.build()
    const output = generateLikeC4({
      // @ts-expect-error - we want to test the function with the parsed data, but the types are not compatible, we only care about the fields used by the generator
      relations: parsed.relations,
      // @ts-expect-error - we want to test the function with the parsed data, but the types are not compatible, we only care about the fields used by the generator
      elements: parsed.elements,
      deployments: parsed.deployments,
      specification: parsed.specification,
    })
    await expect(output).toMatchFileSnapshot('__snapshots__/likec4.generate.snap')
  })
})
