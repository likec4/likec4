import { describe, it } from 'vitest'
import { Builder } from '../builder'

describe('LikeC4DeploymentModel', () => {
  const model = Builder
    .specification({
      elements: {
        el: {},
        elWithTags: {
          tags: ['tag1'],
        },
      },
      deployments: {
        nd: {},
        vm: {
          tags: ['tag1'],
        },
      },
      tags: {
        tag1: {},
        tag2: {},
        tag3: {},
      },
    })
    .model(({ el, elWithTags, rel }, _) =>
      _(
        el('customer'),
        el('cloud'),
        el('cloud.ui'),
        elWithTags('cloud.backend', {
          tags: ['tag2'],
        }),
        el('infra'),
        el('infra.db'),
        rel('customer', 'cloud'),
        rel('customer', 'cloud.ui'),
        rel('cloud.backend', 'infra.db'),
        rel('cloud.ui', 'cloud.backend'),
        rel('cloud', 'infra'),
      )
    )
    .deployment(({ nd, vm, instanceOf }, d) =>
      d(
        nd('customer').with(
          instanceOf('customer'),
        ),
        nd('prod'),
        nd('prod.z1').with(
          vm('vm1').with(
            instanceOf('cloud.ui'),
          ),
          vm('vm2', {
            tags: ['tag2'],
          }).with(
            instanceOf('backend-with-tags', 'cloud.backend', {
              tags: ['tag3'],
            }),
          ),
        ),
        nd('prod.z2').with(
          vm('vm1').with(
            instanceOf('cloud.ui'),
          ),
          vm('vm2').with(
            instanceOf('cloud.backend'),
          ),
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

  it('roots', ({ expect }) => {
    expect(d.roots()).to.have.same.members([
      d.element('customer'),
      d.element('prod'),
    ])
  })

  it('instance ref', ({ expect }) => {
    const el = d.instance('prod.z1.vm1.ui')
    expect(el.element).toBe(model.element('cloud.ui'))
  })

  it('parent and children', ({ expect }) => {
    const el = d.instance('prod.z1.vm1.ui')
    expect(el.parent).toBe(d.node('prod.z1.vm1'))
    expect(el.parent.children()).to.have.same.members([
      d.element('prod.z1.vm1.ui'),
    ])
    expect(d.node('prod.z1').children()).to.have.same.members([
      d.element('prod.z1.vm1'),
      d.element('prod.z1.vm2'),
    ])
  })

  it('element deployments', ({ expect }) => {
    expect(model.element('cloud.ui').deployments()).to.have.same.members([
      d.instance('prod.z1.vm1.ui'),
      d.instance('prod.z2.vm1.ui'),
    ])
  })

  it('deployment node tags', ({ expect }) => {
    expect(d.node('prod.z1.vm1').tags).toEqual([
      'tag1',
    ])
    expect(d.node('prod.z1.vm2').tags).toEqual([
      'tag2',
      'tag1',
    ])
  })

  it('deployment instance tags', ({ expect }) => {
    // Ensure Element tags
    expect(model.element('cloud.backend').tags).toEqual([
      'tag2',
      'tag1',
    ])
    expect(d.element('prod.z1.vm2.backend-with-tags').isInstance()).toBe(true)
    // Ensure Instance tags are inherited from the element
    expect(d.element('prod.z1.vm2.backend-with-tags').tags).toEqual([
      'tag3',
      'tag2',
      'tag1',
    ])
    expect(d.element('prod.z2.vm2.backend').tags).toEqual([
      'tag2',
      'tag1',
    ])
    // Check memoization
    const tags1 = d.element('prod.z1.vm2.backend-with-tags').tags
    const tags2 = d.element('prod.z1.vm2.backend-with-tags').tags
    expect(tags1).toBe(tags2)

    const tags3 = d.element('prod.z2.vm2.backend').tags
    expect(tags3).not.toBe(tags2)
  })

  it('views with instance', ({ expect }) => {
    const [view] = [...model.deployment.instance('customer.customer').views()]
    expect(view).toBeDefined()
    // View includes parent of the instance, not the instance itself
    // But still returned as a view of the instance
    expect(view!.includesDeployment('customer')).toBe(true)
    expect(view!.includesDeployment('customer.customer')).toBe(false)
  })
})
