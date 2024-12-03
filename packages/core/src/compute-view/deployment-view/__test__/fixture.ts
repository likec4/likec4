import { map, prop } from 'remeda'
import { Builder } from '../../../builder'
import type { DeploymentViewRuleBuilderOp } from '../../../builder/Builder.view'
import { LikeC4Model } from '../../../model'
import type { ComputedDeploymentView, DeploymentView } from '../../../types'
import { mkComputeView } from '../../compute-view'
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
    view,
    views,
    viewOf,
    deploymentView,
    $rules,
    $include,
    $exclude,
    $style
  }
} = Builder.forSpecification({
  elements: {
    person: {
      style: {
        shape: 'person'
      }
    },
    system: {},
    component: {},
    webapp: {
      style: {
        shape: 'browser'
      }
    },
    mobile: {
      style: {
        shape: 'mobile'
      }
    }
  },
  deployments: {
    env: {},
    zone: {},
    node: {}
  }
})

export const builder = b
  .with(
    model(
      person('customer'),
      system('cloud').with(
        component('frontend').with(
          webapp('dashboard'),
          mobile('mobile')
        ),
        component('auth'),
        component('backend').with(
          component('api')
        ),
        component('media', {
          shape: 'storage'
        })
      ),
      system('aws').with(
        component('rds', {
          shape: 'storage'
        }),
        component('s3', {
          shape: 'storage'
        })
      ),
      system('email')
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
      $m.rel('email', 'customer', 'sends emails')
    ),
    deployment(
      node('customer').with(
        instanceOf('instance', 'customer')
      ),
      env('prod').with(
        zone('eu').with(
          zone('zone1').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard')
          ),
          zone('zone2').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard')
          ),
          instanceOf('media', 'cloud.media'),
          instanceOf('db', 'aws.rds')
        ),
        zone('us').with(
          zone('zone1').with(
            instanceOf('api', 'cloud.backend.api'),
            instanceOf('ui', 'cloud.frontend.dashboard')
          ),
          instanceOf('db', 'aws.rds')
        )
      ),
      // Global
      env('global').with(
        instanceOf('email', 'email')
      ),
      $d.rel('prod.eu.db', 'prod.us.db', 'replicates')
    )
    // views(
    //   view('index', $include('*')),
    //   viewOf('cloud', 'cloud', $rules(
    //     $include('*'),
    //   )),
    //   deploymentView('prod', $rules(
    //     $include('customer.c'),
    //     $include('prod._'),
    //     $exclude('prod.eu.zone1 <-> prod.eu.zone2')
    //   ))
    // )
  )

export type Types = typeof builder['Types']

export { $exclude, $include }

const compute = mkComputeView(builder.build())

export function computeView(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  const model = builder.with(
    views(
      deploymentView('index', $rules(...rules))
    )
  ).build()
  const view = compute(model.views.index).view as ComputedDeploymentView
  return Object.assign(view, {
    nodeIds: map(view.nodes, prop('id')) as string[],
    edgeIds: map(view.edges, prop('id')) as string[]
  })
}

export function computeView2(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  const modelsource = builder.with(
    views(
      deploymentView('index', $rules(...rules))
    )
  ).build()

  const model = LikeC4Model.create({
    ...modelsource,
    views: {}
  })

  const view = withReadableEdges(computeDeploymentView(model, modelsource.views.index as DeploymentView))

  return Object.assign(view, {
    nodeIds: map(view.nodes, prop('id')) as string[],
    edgeIds: map(view.edges, prop('id')) as string[]
  })
}

export function computeNodesAndEdges(...rules: DeploymentViewRuleBuilderOp<Types>[]) {
  const { nodeIds, edgeIds } = computeView2(...rules)
  return {
    // Starts with capital letter to be first in snapshot
    Nodes: nodeIds,
    edges: edgeIds
  }
}
