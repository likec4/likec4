import { map, prop } from 'remeda'
import { Builder } from '../../../builder'
import type { DeploymentViewRuleBuilderOp } from '../../../builder/Builder.view'
import type { ComputedDeploymentView } from '../../../types'
import { mkComputeView } from '../../compute-view'

const {
  builder: b,
  model: {
    model,
    person,
    system,
    component,
    webapp,
    mobile,
    rel
  },
  deployment: {
    deployment,
    env,
    node,
    zone,
    instanceOf
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
      rel('customer', 'cloud', 'uses services'),
      rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
      rel('customer', 'cloud.frontend.dashboard', 'opens in browser'),
      rel('cloud.frontend.dashboard', 'cloud.auth', 'authenticates'),
      rel('cloud.frontend.dashboard', 'cloud.backend.api', 'fetches data'),
      rel('cloud.frontend.dashboard', 'cloud.media', 'fetches media'),
      rel('cloud.frontend.mobile', 'cloud.auth', 'authenticates'),
      rel('cloud.frontend.mobile', 'cloud.backend.api', 'fetches data'),
      rel('cloud.frontend.mobile', 'cloud.media', 'fetches media'),
      rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
      rel('cloud.backend.api', 'cloud.media', 'uploads media'),
      rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      rel('cloud.backend.api', 'email', 'sends emails'),
      rel('cloud.media', 'aws.s3', 'uploads'),
      rel('email', 'customer', 'sends emails')
    ),
    deployment(
      node('customer').with(
        instanceOf('instance', 'customer')
      ),
      env('prod').with(
        zone('eu').with(
          zone('zone1').with(
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api')
          ),
          zone('zone2').with(
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api')
          ),
          instanceOf('media', 'cloud.media')
        )
      )
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

type Types = typeof builder['Types']

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
