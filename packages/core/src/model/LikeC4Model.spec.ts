import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../builder/Builder'
import { computeViews } from '../compute-view/compute-view'
import { LikeC4Model } from './LikeC4Model'

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

const source = b
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
  .build()

describe('LikeC4Model', () => {
  const model = LikeC4Model.create(computeViews(source))

  it('roots', () => {
    expect(model.roots().toArray().map(prop('id'))).toEqual([
      'customer',
      'cloud',
      'aws',
      'email'
    ])
  })

  it('parent and children', () => {
    const parent = model.parent(source.elements['cloud.backend.api'])!
    expect(parent.id).toEqual('cloud.backend')
    expect(parent.$element).toStrictEqual(source.elements['cloud.backend'])

    const children = parent.children().toArray()

    expect(map(children, prop('id'))).toEqual([
      'cloud.backend.api',
      'cloud.backend.graphql'
    ])
  })

  it('ancestors in right order', () => {
    const ancestors = model.element(source.elements['cloud.frontend.dashboard']).ancestors().toArray()
    expect(ancestors).toHaveLength(2)
    expect(ancestors[0]).toMatchObject({
      id: 'cloud.frontend',
      $element: source.elements['cloud.frontend']
    })
    expect(ancestors[1]).toMatchObject({
      id: 'cloud',
      $element: source.elements['cloud']
    })
  })

  it('siblings of root', () => {
    const siblings = model.element('cloud').siblings().toArray()
    expect(siblings.map(prop('id'))).toEqual([
      'customer',
      'aws',
      'email'
    ])
  })

  it('siblings', () => {
    const backend = model.element('cloud.backend')

    const siblings = backend.siblings().toArray()

    expect(siblings.map(prop('id'))).toEqual([
      'cloud.frontend',
      'cloud.auth',
      'cloud.media'
    ])
  })

  it('descendants in right order', () => {
    const descendants = model.element('cloud').descendants().map(prop('id')).toArray()
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
    const incoming = model.element('cloud').incoming().toArray()
    expect(incoming.map(r => `${r.source.id}:${r.target.id}`)).toEqual([
      'customer:cloud',
      'customer:cloud.frontend.mobile',
      'customer:cloud.frontend.dashboard'
    ])
    const incomers = model.element('cloud').incomers().toArray()
    expect(incomers.map(prop('id'))).toEqual([
      'customer'
    ])
  })

  it('unique outgoers', () => {
    const outgoing = model.element('cloud.frontend').outgoing().toArray()
    expect(outgoing.map(r => `${r.source.id}:${r.target.id}`)).toEqual([
      'cloud.frontend.dashboard:cloud.auth',
      'cloud.frontend.dashboard:cloud.backend.api',
      'cloud.frontend.dashboard:cloud.media',
      'cloud.frontend.mobile:cloud.auth',
      'cloud.frontend.mobile:cloud.backend.api',
      'cloud.frontend.mobile:cloud.media'
    ])
    const outgoers = model.element('cloud.frontend').outgoers().toArray()
    expect(outgoers.map(prop('id'))).toEqual([
      'cloud.auth',
      'cloud.backend.api',
      'cloud.media'
    ])
  })
})
