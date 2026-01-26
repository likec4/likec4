import type { ViewId } from '@likec4/core'
import { prop } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder -- globals', () => {
  it('local styles are applied to all views', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        style * {
          color green
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View).toBeDefined()
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('local styles are overwritten by internal view styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          style * {
            color red
          }
        }

        view sys2 {
          include sys2
        }

        style * {
          color green
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('red')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View).toBeDefined()
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('global style is applied to a view', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style style_name
        }
      }
      global {
        style style_name * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)

    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style is overridden by further styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style style_id
          style element.kind=component {
            color red
          }
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('red')
  })

  it('global style overrides previous styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          style element.kind=component {
            color red
          }
          global style style_id
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style is not applied if not defined', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          global style missing_style_id
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.severity).toBe(1)

    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('primary')
  })

  it('the first global style with duplicated name is applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag element_tag
      }
      model {
        component sys1 {
          #element_tag
        }
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style repeated_style_id
        }
      }
      global {
        style repeated_style_id * {
          color green
        }
        style repeated_style_id element.tag = #element_tag {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style group is applied to a view', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style group can be filtered on tags', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include *
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
          style element.tag = #deprecated {
            color muted
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('muted')
  })

  it('global style group entreis are applied in order', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include *
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style element.tag = #deprecated {
            color muted
          }
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('global style group is overwritten by further styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style style_group_name
          style * {
            color secondary
          }
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
            opacity 10%
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('secondary')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.style.opacity).toBe(10)
  })

  it('global style group overwrites previous styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          style * {
            color secondary
            opacity 50%
          }
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.style.opacity).toBe(50)
  })

  it('global style group is not applied if missing', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          style * {
            color secondary
          }
          global style missing_style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('secondary')
  })

  it('global style group can be applied with a global style', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          global style style_group_name
          global style style_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
            opacity 70%
          }
        }
        style style_name * {
          multiple true
          color red
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    const sys1 = indexView.nodes.find(n => n.id === 'sys1')!
    expect(sys1.color).toBe('red')
    expect(sys1.style).toMatchObject({
      multiple: true,
      opacity: 70,
    })
  })

  it('global style group should not share a name with a global style', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1

          global style repeated_style_name
        }
      }
      global {
        styleGroup repeated_style_name {
          style * {
            color green
          }
        }
        style repeated_style_name * {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('local styles can apply global styles', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_name
      }
      global {
        style global_style_name * {
          color amber
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('amber')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('amber')
  })

  it('local styles can apply global style groups', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_group_name
      }
      global {
        styleGroup global_style_group_name {
          style * {
            color amber
          }
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('amber')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('amber')
  })

  it('local styles are applied in order', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_red
        global style global_style_green
      }
      global {
        style global_style_green * {
          color green
        }

        style global_style_red * {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('global predicate groups are applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global predicate global_predicate_group_name
        }
      }
      global {
        predicateGroup global_predicate_group_name {
          include * where tag is #deprecated
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.map(prop('id'))).toEqual(['sys1', 'sys2'])
  })

  it('global dynamic predicate groups are applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag important
      }
      model {
        component sys1
        component sys2
        component sys3 {
          #important
        }
        sys1 -> sys2
      }
      views {
        dynamic view dynamic_view {
          sys1 -> sys2 'performs an action'
          global predicate global_predicate_group_name
        }
      }
      global {
        dynamicPredicateGroup global_predicate_group_name {
          include sys3
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const dynamicView = model?.views['dynamic_view' as ViewId]!
    expect(dynamicView).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys1')).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys2')).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys3')).toBeDefined()
  })
})
