import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../test'

describe.concurrent('ProjectsManager', () => {
  it('should assign likec4ProjectId to docs', async ({ expect }) => {
    const { projects, addDocumentOutside, validateAll } = await createMultiProjectTestServices({
      project1: {
        'specs': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
        'model': `
          model {
            component c2
          }
        `,
      },
      project2: {
        'specs': `
          specification {
            element component
          }
          model {
            component c1
          }
        `,
      },
    })

    const { errors, warnings } = await validateAll()
    expect(errors).toHaveLength(0)
    expect(warnings).toHaveLength(0)

    expect(projects.project1.specs).toHaveProperty('likec4ProjectId', 'project1')
    expect(projects.project1.model).toHaveProperty('likec4ProjectId', 'project1')
    expect(projects.project2.specs).toHaveProperty('likec4ProjectId', 'project2')

    const outside = await addDocumentOutside('specification { element component }')
    expect(outside).not.toHaveProperty('likec4ProjectId')
    await validateAll()
    expect(outside).toHaveProperty('likec4ProjectId', 'default')
  })
})
