import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../builder/Builder'
import { computeViews } from '../compute-view/compute-view'
import { LikeC4Model } from './index'

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

const builder = b
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
          component('api'),
          component('graphql')
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
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api')
          ),
          zone('zone2').with(
            instanceOf('ui', 'cloud.frontend.dashboard'),
            instanceOf('api', 'cloud.backend.api')
          ),
          instanceOf('media', 'cloud.media'),
          instanceOf('db', 'aws.rds')
        ),
        zone('us').with(
          instanceOf('db', 'aws.rds')
        )
      ),
      $d.rel('prod.eu.db', 'prod.us.db', 'replicates')
    ),
    views(
      view('index', $include('*')),
      viewOf(
        'cloud',
        'cloud',
        $rules(
          $include('*'),
          $include('cloud.frontend.dashboard')
        )
      ),
      deploymentView(
        'prod',
        $rules(
          $include('customer.instance'),
          $include('prod.eu.zone1.ui')
        )
      )
    )
  )

export const source = builder.build()
type Id = typeof builder.Types.Fqn

describe('LikeC4Model', () => {
  const els = source.elements
  const model = LikeC4Model.create(computeViews(source))

  it('roots', () => {
    expect([...model.roots()].map(prop('id'))).toEqual([
      'customer',
      'cloud',
      'aws',
      'email'
    ])
  })

  it('parent and children', () => {
    const parent = model.parent('cloud.backend.api')!
    expect(parent.id).toEqual('cloud.backend')
    expect(parent.$element).toStrictEqual(els['cloud.backend'])

    const children = [...parent.children()]

    expect(map(children, prop('id'))).toEqual([
      'cloud.backend.api',
      'cloud.backend.graphql'
    ])
  })

  it('ancestors in right order', () => {
    const ancestors = [...model.element('cloud.frontend.dashboard').ancestors()]
    expect(ancestors).toHaveLength(2)
    expect(ancestors[0]).toMatchObject({
      id: 'cloud.frontend',
      $element: els['cloud.frontend']
    })
    expect(ancestors[1]).toMatchObject({
      id: 'cloud',
      $element: els['cloud']
    })
  })

  it('siblings of root', () => {
    const siblings = [...model.element('cloud').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'customer',
      'aws',
      'email'
    ])
  })

  it('siblings of nested', () => {
    const siblings = [...model.element('cloud.backend').siblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'cloud.frontend',
      'cloud.auth',
      'cloud.media'
    ])
  })

  it('ascendingSiblings', () => {
    const siblings = [...model.element('cloud.backend.graphql').ascendingSiblings()]
    expect(siblings.map(prop('id'))).toEqual([
      'cloud.frontend',
      'cloud.auth',
      'cloud.media',
      'customer',
      'aws',
      'email'
    ])
  })

  it('descendants in right order', () => {
    const descendants = [...model.element('cloud').descendants()].map(prop('id'))
    expect(descendants).toEqual([
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.frontend.mobile',
      'cloud.auth',
      'cloud.backend',
      'cloud.backend.api',
      'cloud.backend.graphql',
      'cloud.media'
    ])
  })

  // it('internal relations', () => {
  //   expect(
  //     model.internal('cloud.backend').map(prop('id'))
  //   ).toEqual([
  //     'cloud.backend.graphql:cloud.backend.storage'
  //   ])
  // })

  it('unique incomers', () => {
    const incoming = [...model.element('cloud').incoming()].map(r => `${r.source.id}:${r.target.id}`)
    expect(incoming).toEqual([
      'customer:cloud',
      'customer:cloud.frontend.mobile',
      'customer:cloud.frontend.dashboard'
    ])
    const incomers = [...model.element('cloud').incomers()].map(prop('id'))
    expect(incomers).toEqual([
      'customer'
    ])
  })

  it('unique outgoers', () => {
    const outgoing = [...model.element('cloud.frontend').outgoing()].map(r => `${r.source.id}:${r.target.id}`)
    expect(outgoing).toEqual([
      'cloud.frontend.dashboard:cloud.auth',
      'cloud.frontend.dashboard:cloud.backend.api',
      'cloud.frontend.dashboard:cloud.media',
      'cloud.frontend.mobile:cloud.auth',
      'cloud.frontend.mobile:cloud.backend.api',
      'cloud.frontend.mobile:cloud.media'
    ])
    const outgoers = [...model.element('cloud.frontend').outgoers()].map(prop('id'))
    expect(outgoers).toEqual([
      'cloud.auth',
      'cloud.backend.api',
      'cloud.media'
    ])
  })

  it('views with element', () => {
    const views = (id: Id) => [...model.element(id).views()].map(prop('id'))

    expect.soft(views('cloud')).toEqual([
      'index',
      'cloud'
    ])

    expect.soft(views('cloud.frontend.dashboard')).toEqual([
      'cloud',
      'prod'
    ])

    expect.soft(views('customer')).toEqual([
      'index',
      'cloud',
      'prod'
    ])
  })
})
