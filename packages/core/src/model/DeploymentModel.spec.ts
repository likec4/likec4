import { describe, expect, it } from 'vitest'
import { Builder } from '../builder'

describe('LikeC4DeploymentModel', () => {
  const model = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        nd: {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('customer'),
        el('cloud'),
        el('cloud.ui'),
        el('cloud.backend'),
        el('infra'),
        el('infra.db'),
        rel('customer', 'cloud'),
        rel('customer', 'cloud.ui'),
        rel('cloud.backend', 'infra.db'),
        rel('cloud.ui', 'cloud.backend'),
        rel('cloud', 'infra'),
      )
    )
    .deployment(({ nd, instanceOf }, d) =>
      d(
        nd('customer').with(
          instanceOf('customer'),
        ),
        nd('prod'),
        nd('prod.z1').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend'),
        ),
        nd('prod.z2').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend'),
        ),
        nd('prod.infra').with(
          instanceOf('infra.db'),
        ),
      )
    )
    .views(({ viewOf, deploymentView, $include }, _) =>
      _(
        viewOf('index', 'cloud').with(
          $include('*'),
        ),
        deploymentView('prod').with(
          $include('*'),
          $include('prod.**'),
        ),
      )
    )
    .toLikeC4Model()
  const d = model.deployment

  it('roots', () => {
    expect(d.roots()).to.have.same.members([
      d.element('customer'),
      d.element('prod'),
    ])
  })

  it('instance ref', () => {
    const el = d.instance('prod.z1.ui')
    expect(el.element).toBe(model.element('cloud.ui'))
  })

  it('parent and children', () => {
    const el = d.instance('prod.z1.ui')
    expect(el.parent).toBe(d.node('prod.z1'))
    expect(el.parent.children()).to.have.same.members([
      d.element('prod.z1.backend'),
      d.element('prod.z1.ui'),
    ])
  })

  it('element deployments', () => {
    expect(model.element('cloud.ui').deployments()).to.have.same.members([
      d.instance('prod.z1.ui'),
      d.instance('prod.z2.ui'),
    ])
  })

  it('views with instance', () => {
    const [view] = [...model.deployment.instance('customer.customer').views()]
    expect(view).toBeDefined()
    // View includes parent of the instance, not the instance itself
    // But still returned as a view of the instance
    expect(view!.includesDeployment('customer')).toBe(true)
    expect(view!.includesDeployment('customer.customer')).toBe(false)
  })
})
