import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder -- view folders', () => {
  it('without view folders', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      views {
        view v1 {
          title 'View 1'
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    const model = await buildLikeC4Model()
    expect(model.hasViewFolders).toBe(false)
    expect([...model.rootViewFolder.children]).toEqual([
      model.view('index'),
      model.view('v1'),
    ])
  })

  it('view folders are created', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
      }
      views {
        view g1_sub1 {
          title 'Group 1 / Subgroup 1'
          include *
        }

        view g1_sub2_view1 {
          title 'Group 1 / Subgroup 2 / View 1'
          include *
        }
      }
    `)
    expect(errors).toEqual([])
    const model = await buildLikeC4Model()
    expect(model.hasViewFolders).toBe(true)
    expect([...model.rootViewFolder.children]).toEqual([
      model.viewFolder('Group 1'),
      model.view('index'),
    ])
  })
})
