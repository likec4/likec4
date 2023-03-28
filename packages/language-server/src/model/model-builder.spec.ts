import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

describe('LikeC4ModelBuilder', () => {

  const {validate, buildModel} = createTestServices()

  it('builds model', async () => {
    const { diagnostics } = await validate(`
    specification {
      element component
      element user
      tag deprecated
    }
    model {
      user client {
        -> frontend
      }
      component system {
        backend = component 'Backend'
        component frontend {
          #deprecated
          -> backend 'requests'
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model).toMatchSnapshot()
  })

})
