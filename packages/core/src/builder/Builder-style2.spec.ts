import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder (style 2)', () => {
  const spec = Builder
    .specification({
      elements: {
        system: {},
        component: {},
        actor: {}
      },
      deployments: {
        env: {},
        node: {}
      }
    })
    .clone()

  it('should build ', () => {
    const b = spec
      .model(({ system, actor, component }, _) =>
        _(
          actor('customer'),
          system('cloud').with(
            component('ui')
          )
        )
      )
      .deployment(({ env, node, instanceOf }, _) =>
        _(
          env('prod').with(
            node('eu').with(
              instanceOf('ui', 'cloud.ui')
            )
          )
        )
      )
      .views(({ view, viewOf, deploymentView, $include }, _) =>
        _(
          view('index', 'Index').with(
            $include('cloud.*')
          ),
          viewOf('cloud', 'cloud.ui').with(
            $include('* -> cloud.**')
          ),
          deploymentView('deployment', 'Deployment').with(
            $include('prod.**')
          )
        )
      )

    expect(b.build()).toMatchSnapshot()
  })

  it('should fail if invalid ID provided ', () => {
    expect(() => {
      spec.model(({ actor }, _) =>
        _(
          actor('cust.omer')
        )
      )
    }).toThrowError('Parent element with id "cust" not found for element with id "cust.omer"')
  })
})
