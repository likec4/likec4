import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices, mockMethod } from '../../test'

describe('LikeC4ModelBuilder -- projects', () => {
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

  it('should rebuild model when project config changes', async ({ expect }) => {
    await using t = await createMultiProjectTestServices({})
    const folderUri = URI.parse('file:///test/workspace/src/test-project-1')
    // Config change rebuilds project documents, they are re-read from the file system
    const langiumDocuments = t.services.shared.workspace.LangiumDocuments
    mockMethod(t.services.shared.workspace.FileSystemProvider, 'readFile').mockImplementation(async uri =>
      langiumDocuments.getDocument(uri)?.textDocument.getText() ?? ''
    )

    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'Before',
      },
      folderUri,
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
    const before = await t.buildLikeC4Model('test-project')
    expect(before.project.title).toBe('Before')

    // Same documents, only config is changed
    await t.projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'After',
        styles: {
          theme: {
            colors: {
              primary: '#ff0000',
            },
          },
        },
      },
      folderUri,
    })

    const after = await t.buildLikeC4Model('test-project')
    expect(after.project.title).toBe('After')
    expect(after.$data.project.styles?.theme?.colors?.['primary']).toMatchObject({
      elements: { fill: '#ff0000' },
    })
  })
})
