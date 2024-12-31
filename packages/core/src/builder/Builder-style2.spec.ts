import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder (style 2)', () => {
  const spec = Builder
    .specification({
      elements: {
        system: {},
        component: {},
        actor: {},
      },
      deployments: {
        env: {},
        node: {},
      },
    })

  it('should build ', () => {
    const b = spec.clone()
      .model(({ system, actor, component }, _) =>
        _(
          actor('customer'),
          system('cloud').with(
            component('ui'),
          ),
        )
      )
      .deployment(({ env, node, instanceOf }, _) =>
        _(
          env('prod').with(
            node('eu').with(
              instanceOf('cloud.ui'),
            ),
          ),
          env('dev'),
          node('dev.local'),
        )
      )
      .views(({ view, viewOf, deploymentView, $include }, _) =>
        _(
          view('index', 'Index').with(
            $include('cloud.*'),
          ),
          viewOf('cloud', 'cloud.ui').with(
            $include('* -> cloud.**'),
          ),
          deploymentView('deployment', 'Deployment').with(
            $include('prod.**'),
          ),
        )
      )

    expect(b.build()).toMatchSnapshot()
  })

  it('should fail if invalid ID provided ', () => {
    expect(() => {
      spec.model(({ actor }, _) =>
        _(
          actor('cust.omer'),
        )
      )
    }).toThrowError('Parent element with id "cust" not found for element with id "cust.omer"')
  })

  it('should fail on invalid instance ', () => {
    const b = spec.clone()
      .model(_ =>
        _.model(
          _.component('cloud'),
          _.component('cloud.ui'),
        )
      )

    expect(() => {
      const raw = b.deployment(_ =>
        _.deployment(
          _.instanceOf('cloud.ui'),
        )
      ).build()
    }).toThrowError('Instance ui of cloud.ui must be deployed under a parent node')

    // Nested instanceOf is correct

    const raw = b.deployment(_ =>
      _.deployment(
        _.node('node').with(
          _.instanceOf('cloud.ui'),
        ),
      )
    ).build()
    expect(raw.deployments.elements).toEqual({
      node: expect.objectContaining({ id: 'node' }),
      // Take name from element
      'node.ui': expect.objectContaining({ id: 'node.ui', element: 'cloud.ui' }),
    })
  })
})
