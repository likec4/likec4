import type { ViewId } from '@likec4/core'
import { describe, it, vi } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder -- caches', () => {
  it.concurrent('build model returns cached result', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
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
          include *
        }
      }
    `)

    const model1 = await buildModel()
    const model2 = await buildModel()
    expect(model1).toStrictEqual(model2)
  })

  it.concurrent('return cached views if there are no changes', async ({ expect }) => {
    const { parse, validateAll, buildModel } = createTestServices()
    await parse(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2 {
          component sys22 {
            -> sys1
          }
        }
      }
      views {
        view index {
          include *
        }
        view sys2 of sys2 {
          include *
        }
      }
    `)

    const first = await validateAll()
    expect(first.errors).toHaveLength(0)

    const model1 = await buildModel()

    // add model
    await parse(`
      model {
        component sys3
      }
    `)

    const second = await validateAll()
    expect(second.errors).toHaveLength(0)

    const model2 = await buildModel()

    // model changed
    expect(model1).not.toStrictEqual(model2)

    // index view has changed
    expect(model1.views['index' as ViewId]).not.toStrictEqual(model2.views['index' as ViewId])

    // expect that sys2 view is the same
    expect(model1.views['sys2' as ViewId]).toStrictEqual(model2.views['sys2' as ViewId])
  })
})

describe('LikeC4ModelBuilder -- logging and cache behavior', () => {
  it.concurrent('should handle empty project documents gracefully', async ({ expect }) => {
    const { services } = createTestServices()
    
    // Register a project with no documents
    await services.shared.workspace.ProjectsManager.registerProject({
      config: { name: 'emptyProject' },
      folderUri: 'file:///test/workspace/emptyProject',
    })

    const model = await services.likec4.ModelBuilder.computeModel('emptyProject' as any)
    expect(model).toBeDefined()
    expect(model.$data.elements).toEqual({})
    expect(model.$data.views).toEqual({})
  })

  it.concurrent('should cache parsed model data', async ({ expect }) => {
    const { validate, services } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
    `)

    // First call should populate cache
    const model1 = await services.likec4.ModelBuilder.parseModel()
    expect(model1).toBeDefined()

    // Second call should return cached result
    const model2 = await services.likec4.ModelBuilder.parseModel()
    expect(model2).toBe(model1)
  })

  it.concurrent('should cache computed model', async ({ expect }) => {
    const { validate, services } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      views {
        view index {
          include *
        }
      }
    `)

    // First call should populate cache
    const model1 = await services.likec4.ModelBuilder.computeModel()
    expect(model1).toBeDefined()

    // Second call should return cached result
    const model2 = await services.likec4.ModelBuilder.computeModel()
    expect(model2).toBe(model1)
  })

  it.concurrent('should clear cache when requested', async ({ expect }) => {
    const { validate, services, buildModel } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      views {
        view index {
          include *
        }
      }
    `)

    const model1 = await buildModel()
    
    // Clear cache
    services.likec4.ModelBuilder.clearCache()

    // Should rebuild model
    const model2 = await buildModel()
    expect(model1).not.toBe(model2)
    expect(model1).toStrictEqual(model2)
  })

  it.concurrent('should cache models per project', async ({ expect }) => {
    const { services, projectsManager } = await import('../../test').then(m => m.createMultiProjectTestServices({
      project1: {
        spec: 'specification { element component }',
        model: 'model { component c1 }',
      },
      project2: {
        spec: 'specification { element component }',
        model: 'model { component c2 }',
      },
    }))

    await services.shared.workspace.LangiumDocuments.all.toArray()

    const model1 = await services.likec4.ModelBuilder.computeModel('project1' as any)
    const model2 = await services.likec4.ModelBuilder.computeModel('project2' as any)

    expect(model1).not.toBe(model2)
    expect(Object.keys(model1.$data.elements)).toContain('c1')
    expect(Object.keys(model2.$data.elements)).toContain('c2')
  })
})
