import { describe, it } from 'vitest'
import { Builder } from '../../builder'

describe('LikeC4ViewsGroup', () => {
  const model = Builder
    .specification({
      elements: {
        el: {},
      },
    })
    .model(({ el }, _) =>
      _(
        el('customer'),
        el('cloud'),
        el('cloud.ui', {
          title: 'UI',
        }),
      )
    )
    .views(({ view }, _) =>
      _(
        view('index'),
        view('b'),
        view('a'),
        view('cloud2-subview', 'One / Cloud 2 / Subview'),
        view('cloud2', 'One / Cloud 2'),
        view('cloud1', 'One / Cloud 1'),
        view('cloud1-subview', 'One / Cloud 1 / Subgroup / Subview'),
      )
    )
    .toLikeC4Model()

  it('root view group', ({ expect }) => {
    expect(model.rootViewGroup).toBeDefined()
    expect(model.rootViewGroup.title).toBe('')
    expect(model.rootViewGroup.path).toBe('')
    expect(model.rootViewGroup.isRoot).toBe(true)
    expect(() => model.rootViewGroup.parent).toThrow()
    expect(() => model.rootViewGroup.breadcrumbs).toThrow()
    // Should preserve order of views
    expect([...model.rootViewGroup.children]).toEqual([
      model.viewGroup('One'),
      model.view('index'),
      model.view('b'),
      model.view('a'),
    ])
    expect([...model.rootViewGroup.views]).toEqual([
      model.view('index'),
      model.view('b'),
      model.view('a'),
    ])
    const indexView = model.view('index')

    expect(indexView.viewGroup).toBeNull()
    expect(indexView.breadcrumbs).toEqual([indexView])
    expect(model.rootViewGroup.defaultView).toBe(model.view('index'))
  })

  describe('view group (top-level)', () => {
    it('One', ({ expect }) => {
      const group = model.viewGroup('One')
      expect(group).toBeDefined()
      expect(group.title).toBe('One')
      expect(group.path).toBe('One')
      expect(group.isRoot).toBe(false)
      expect(group.parent).toBeNull()
      expect(group.breadcrumbs).toEqual([group])
      // Should preserve order of views
      expect([...group.children]).toEqual([
        model.viewGroup('One/Cloud 1'),
        model.viewGroup('One/Cloud 2'),
        model.view('cloud2'),
        model.view('cloud1'),
      ])
    })
  })

  describe('view group (level 2)', () => {
    it('One/Cloud 1', ({ expect }) => {
      const group = model.viewGroup('One/Cloud 1')
      expect(group).toBeDefined()
      expect(group.title).toBe('Cloud 1')
      expect(group.path).toBe('One/Cloud 1')
      expect(group.isRoot).toBe(false)
      expect(group.parent).toBe(model.viewGroup('One'))
      expect(group.breadcrumbs).toEqual([
        model.viewGroup('One'),
        group,
      ])
      expect(group.defaultView).toBe(model.view('cloud1'))
      expect([...group.children]).toEqual([
        model.viewGroup('One/Cloud 1/Subgroup'),
      ])
    })

    it('One/Cloud 2', ({ expect }) => {
      const group = model.viewGroup('One/Cloud 2')
      expect(group).toBeDefined()
      expect(group.title).toBe('Cloud 2')
      expect(group.path).toBe('One/Cloud 2')
      expect(group.isRoot).toBe(false)
      expect(group.parent).toBe(model.viewGroup('One'))
      expect(group.breadcrumbs).toEqual([
        model.viewGroup('One'),
        group,
      ])
      expect([...group.children]).toEqual([
        model.view('cloud2-subview'),
      ])
      expect(group.defaultView).toBe(model.view('cloud2'))
      expect(model.view('cloud2-subview').viewGroup).toBe(group)

      expect(() => model.viewGroup('One/Cloud 2/Subview')).toThrow()
    })
  })

  describe('view group (level 3)', () => {
    it('One/Cloud 1/Subgroup', ({ expect }) => {
      const group = model.viewGroup('One/Cloud 1/Subgroup')
      expect(group).toBeDefined()
      expect(group.title).toBe('Subgroup')
      expect(group.path).toBe('One/Cloud 1/Subgroup')
      expect(group.isRoot).toBe(false)
      expect(group.parent).toBe(model.viewGroup('One/Cloud 1'))
      expect(group.breadcrumbs).toEqual([
        model.viewGroup('One'),
        model.viewGroup('One/Cloud 1'),
        group,
      ])
      expect(group.defaultView).toBeNull()
      expect(group.children).toEqual(
        new Set([
          model.view('cloud1-subview'),
        ]),
      )

      const cloud1SubView = model.view('cloud1-subview')
      expect(cloud1SubView.viewGroup).toBe(group)
      expect(cloud1SubView.breadcrumbs).toEqual([
        model.viewGroup('One'),
        model.viewGroup('One/Cloud 1'),
        group,
        cloud1SubView,
      ])

      expect(() => model.viewGroup('One/Cloud 1/Subgroup/Subview')).toThrow()
    })
  })
})
