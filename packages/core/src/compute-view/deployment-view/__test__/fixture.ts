import { map, prop } from 'remeda'
import type { DeploymentRulesBuilderOp } from '../../../builder'
import { Builder } from '../../../builder'
import { LikeC4Model } from '../../../model'
import type { DeploymentView } from '../../../types'
import { withReadableEdges } from '../../utils/with-readable-edges'
import { computeDeploymentView } from '../compute'

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
})

export const builder = b
  .with(
    model(
      person('customer', {
        title: 'Happy Customer',
      }),
      system('cloud').with(
        component('frontend').with(
          webapp('dashboard'),
          mobile('mobile'),
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
      $m.rel('customer', 'cloud', 'uses services'),
      $m.rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
      $m.rel('customer', 'cloud.frontend.dashboard', 'opens in browser'),
      $m.rel('cloud.frontend.dashboard', 'cloud.auth', {
        title: 'authenticates',
        color: 'green',
      }),
      $m.rel('cloud.frontend.dashboard', 'cloud.backend.api', 'fetches data'),
      $m.rel('cloud.frontend.dashboard', 'cloud.media', 'fetches media'),
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
            instanceOf('ui', 'cloud.frontend.dashboard'),
          ),
          zone('zone2').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard'),
          ),
          instanceOf('auth', 'cloud.auth'),
          instanceOf('media', 'cloud.media'),
          instanceOf('db', 'aws.rds'),
        ),
        zone('us').with(
          zone('zone1').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard'),
          ),
          instanceOf('db', 'aws.rds'),
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
    ),
  )
  .clone()

export type Types = typeof builder['Types']

export { $exclude, $include }

export function computeView(...rules: DeploymentRulesBuilderOp<Types>[]) {
  const modelsource = builder.clone()
    .with(
      views(
        deploymentView('index', $rules(...rules)),
      ),
    ).build()

  const model = LikeC4Model.create({
    ...modelsource,
    views: {},
  })

  const view = withReadableEdges(computeDeploymentView(model, modelsource.views.index as DeploymentView))

  return Object.assign(view, {
    nodeIds: map(view.nodes, prop('id')) as string[],
    edgeIds: map(view.edges, prop('id')) as string[],
  })
}

export function computeNodesAndEdges(...rules: DeploymentRulesBuilderOp<Types>[]) {
  const { nodeIds, edgeIds } = computeView(...rules)
  return {
    // Starts with capital letter to be first in snapshot
    Nodes: nodeIds,
    edges: edgeIds,
  }
}

export function createModel() {
  const modelsource = builder.build()

  return LikeC4Model.create({
    ...modelsource,
    views: {}
  })
}
