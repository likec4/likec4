import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'
import { keys } from 'rambdax'

describe('LikeC4ModelBuilder', () => {

  it('builds model', async () => {
    const {validate, buildModel} = createTestServices()
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

  it('builds model with extend', async () => {
    const {parse, validateAll, buildModel} = createTestServices()
    await parse(`
    specification {
      element component
      element user
      tag deprecated
    }
    model {
      user client
      component system {
        backend = component 'Backend'
        component frontend {
          #deprecated
          -> backend 'requests'
        }
      }
    }
    `)
    await parse(`
    model {
      extend system.backend {
        component api
      }
      system.frontend -> api
      client -> system.frontend
    }
    `)
    const { errorMessages } = await validateAll()
    expect(errorMessages).toEqual('')
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      'client': {
        'kind': 'user',
      },
      'system.backend.api': {
        'kind': 'component',
      }
    })
    expect(keys(model.relations)).toHaveLength(3)
    expect(model).toMatchSnapshot()
  })

})
