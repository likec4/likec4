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

  it('root view folder', ({ expect }) => {
    expect(model.rootViewFolder).toBeDefined()
    expect(model.rootViewFolder.title).toBe('')
    expect(model.rootViewFolder.path).toBe('')
    expect(model.rootViewFolder.isRoot).toBe(true)
    expect(() => model.rootViewFolder.parent).toThrow()
    expect(() => model.rootViewFolder.breadcrumbs).toThrow()
    // Should preserve order of views
    expect([...model.rootViewFolder.children]).toEqual([
      model.viewFolder('One'),
      model.view('index'),
      model.view('b'),
      model.view('a'),
    ])
    expect([...model.rootViewFolder.views]).toEqual([
      model.view('index'),
      model.view('b'),
      model.view('a'),
    ])
    const indexView = model.view('index')

    expect(indexView.folder).toBe(model.rootViewFolder)
    expect(indexView.breadcrumbs).toEqual([indexView])
    expect(model.rootViewFolder.defaultView).toBe(model.view('index'))
  })

  describe('view folder (top-level)', () => {
    it('One', ({ expect }) => {
      const folder = model.viewFolder('One')
      expect(folder).toBeDefined()
      expect(folder.title).toBe('One')
      expect(folder.path).toBe('One')
      expect(folder.isRoot).toBe(false)
      expect(folder.parent).toBeNull()
      expect(folder.breadcrumbs).toEqual([folder])
      // Should preserve order of views
      expect([...folder.children]).toEqual([
        model.viewFolder('One/Cloud 1'),
        model.viewFolder('One/Cloud 2'),
        model.view('cloud2'),
        model.view('cloud1'),
      ])
    })
  })

  describe('view folder (level 2)', () => {
    it('One/Cloud 1', ({ expect }) => {
      const folder = model.viewFolder('One/Cloud 1')
      expect(folder).toBeDefined()
      expect(folder.title).toBe('Cloud 1')
      expect(folder.path).toBe('One/Cloud 1')
      expect(folder.isRoot).toBe(false)
      expect(folder.parent).toBe(model.viewFolder('One'))
      expect(folder.breadcrumbs).toEqual([
        model.viewFolder('One'),
        folder,
      ])
      expect(folder.defaultView).toBe(model.view('cloud1'))
      expect([...folder.children]).toEqual([
        model.viewFolder('One/Cloud 1/Subgroup'),
      ])
    })

    it('One/Cloud 2', ({ expect }) => {
      const folder = model.viewFolder('One/Cloud 2')
      expect(folder).toBeDefined()
      expect(folder.title).toBe('Cloud 2')
      expect(folder.path).toBe('One/Cloud 2')
      expect(folder.isRoot).toBe(false)
      expect(folder.parent).toBe(model.viewFolder('One'))
      expect(folder.breadcrumbs).toEqual([
        model.viewFolder('One'),
        folder,
      ])
      expect([...folder.children]).toEqual([
        model.view('cloud2-subview'),
      ])
      expect(folder.defaultView).toBe(model.view('cloud2'))
      expect(model.view('cloud2-subview').folder).toBe(folder)

      expect(() => model.viewFolder('One/Cloud 2/Subview')).toThrow()
    })
  })

  describe('view folder (level 3)', () => {
    it('One/Cloud 1/Subgroup', ({ expect }) => {
      const folder = model.viewFolder('One/Cloud 1/Subgroup')
      expect(folder).toBeDefined()
      expect(folder.title).toBe('Subgroup')
      expect(folder.path).toBe('One/Cloud 1/Subgroup')
      expect(folder.isRoot).toBe(false)
      expect(folder.parent).toBe(model.viewFolder('One/Cloud 1'))
      expect(folder.breadcrumbs).toEqual([
        model.viewFolder('One'),
        model.viewFolder('One/Cloud 1'),
        folder,
      ])
      expect(folder.defaultView).toBeNull()
      expect(folder.children).toEqual(
        new Set([
          model.view('cloud1-subview'),
        ]),
      )

      const cloud1SubView = model.view('cloud1-subview')
      expect(cloud1SubView.folder).toBe(folder)
      expect(cloud1SubView.breadcrumbs).toEqual([
        model.viewFolder('One'),
        model.viewFolder('One/Cloud 1'),
        folder,
        cloud1SubView,
      ])

      expect(() => model.viewFolder('One/Cloud 1/Subgroup/Subview')).toThrow()
    })
  })
})
