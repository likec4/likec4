import { LikeC4Model } from '@likec4/core/model'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

describe.concurrent('LikeC4ModelBuilder -- projects', () => {
  it('should assign default project data', async ({ expect }) => {
    const { buildLikeC4Model } = await createMultiProjectTestServices({
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
    const model = await buildLikeC4Model('project1')
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
    const { projectsManager, addDocument, buildLikeC4Model } = await createMultiProjectTestServices({})

    await projectsManager.registerProject({
      config: {
        name: 'test-project',
        title: 'Test Project',
      },
      folderUri: URI.parse('file:///test/workspace/src/test-project-1'),
    })

    await addDocument(
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

    const model = await buildLikeC4Model('test-project')
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
    })

    const defaultModel = await buildLikeC4Model('default')
    expect(defaultModel).toStrictEqual(LikeC4Model.EMPTY)
  })
})
