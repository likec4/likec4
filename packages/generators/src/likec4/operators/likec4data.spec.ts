import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import type { schemas } from '../schemas'
import { materialize, withctx } from './base'
import { likec4data } from './likec4data'

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
          style: {
            multiple: true,
          },
          shape: 'document',
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
      $d.rel('prod.eu.db', 'prod.us.db', {
        title: 'replicates',
        tags: ['internal'],
        color: 'amber',
        line: 'dotted',
      }),
    ),
    views(
      view('index', $include('*')),
      viewOf(
        'cloud',
        'cloud',
        {
          title: 'must\nbe\none line',
          description: {
            md: `Must be\n\nmarkdown`,
          },
        },
        $rules(
          $include('*', 'cloud.frontend.dashboard', '* -> cloud.frontend._'),
        ),
      ),
      deploymentView(
        'prod',
        'prod',
        $rules(
          $include('customer.instance', 'prod.eu.zone1.ui'),
        ),
      ),
    ),
  )

describe('likec4data', () => {
  it('generates valid DSL from parsed model data', async ({ expect }) => {
    const parsed = builder.build()
    const output = materialize(
      withctx(
        {
          relations: parsed.relations,
          elements: parsed.elements,
          deployments: parsed.deployments,
          views: parsed.views,
          specification: parsed.specification,
        } satisfies schemas.likec4data.Input,
        likec4data(),
      ),
    )
    await expect(output).toMatchFileSnapshot('__snapshots__/likec4.generate.snap')
  })
})
