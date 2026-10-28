import { URI } from 'langium'
import { describe, expect, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

describe('LikeC4ModelBuilder -- projects', () => {
  it.each([
    ['projectx', 'projecty'],
    ['projecty', 'projectx'],
  ])('should resolve included element extensions with project order %s, %s', async (first, second) => {
    await using t = await createMultiProjectTestServices({})
    for (const name of [first, second]) {
      await t.projectsManager.registerProject({
        config: {
          name,
          ...(name === 'projectx' ? { include: { paths: ['../projecty/model'] } } : {}),
        },
        folderUri: URI.parse(`file:///test/workspace/src/${name}`),
      })
    }
    await t.addDocument(
      'projecty/model/model.c4',
      `
      specification {
        element app
        element component
      }
      model {
        app appx {
          component existing
        }
      }
    `,
    )
    await t.addDocument(
      'projectx/model.c4',
      `
      specification {
        element user
        relationship consumes
        deploymentNode node
      }
      model {
        user appUser
        extend appx {
          component restAPI {
            component handler
          }
          existing -> restAPI
        }
      }
    `,
    )
    await t.addDocument(
      'projectx/references.c4',
      `
      model {
        appUser .consumes appx.restAPI
        appUser -> appx.restAPI.handler
        extend appx {
          existing -> restAPI.handler
        }
      }
      views {
        view api of appx {
          include restAPI
        }
      }
      deployment {
        node server {
          deployedApp = instanceOf appx
        }
        node client
        client -> server.deployedApp.restAPI.handler
      }
    `,
    )

    const { errors } = await t.validateAll()
    expect(errors).toEqual([])
    const model = await t.buildModel('projectx')
    expect(model.elements['appx.restAPI']).toBeDefined()
    expect(model.elements['appx.restAPI.handler']).toBeDefined()
    expect(Object.values(model.relations)).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: { model: 'appUser' }, target: { model: 'appx.restAPI' }, kind: 'consumes' }),
      expect.objectContaining({ source: { model: 'appUser' }, target: { model: 'appx.restAPI.handler' } }),
      expect.objectContaining({ source: { model: 'appx.existing' }, target: { model: 'appx.restAPI' } }),
      expect.objectContaining({ source: { model: 'appx.existing' }, target: { model: 'appx.restAPI.handler' } }),
    ]))
    const ownerModel = await t.buildModel('projecty')
    expect(ownerModel.elements['appx.restAPI']).toBeUndefined()
  })

  it('should assign default project data', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({
      project1: {
        'doc.c4': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
    })
    const model = await t.buildLikeC4Model('project1')
    expect(model.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(model.projectId).toBe('project1')
    expect(model.project).toEqual({
      id: 'project1',
      title: 'project1',
    })
  })

  it('should assign project data from config', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({})

    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'Test Project',
        manualLayouts: {
          outDir: '.likec4-layouts',
        },
      },
      folderUri: URI.parse('file:///test/workspace/src/test-project-1'),
    })

    await t.addDocument(
      'test-project-1/doc.c4',
      `
        specification {
          element component
        }
        model {
          component c1
        }
      `,
    )

    const model = await t.buildLikeC4Model('test-project')
    expect(model.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(model.projectId).toBe('test-project')
    expect(model.project).toEqual({
      id: 'test-project',
      title: 'Test Project',
      manualLayouts: {
        outDir: '.likec4-layouts',
      },
    })

    // test-project is the only project, so it should be the default
    const defaultModel = await t.buildLikeC4Model('default')
    expect(defaultModel.$data.elements).toMatchObject({
      c1: {
        id: 'c1',
        kind: 'component',
      },
    })
    expect(defaultModel.projectId).toBe('test-project')
    expect(defaultModel.project).toEqual({
      id: 'test-project',
      title: 'Test Project',
      manualLayouts: {
        outDir: '.likec4-layouts',
      },
    })
  })
})
