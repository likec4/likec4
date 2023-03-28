import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'
import { keys } from 'rambdax'

describe('LikeC4ModelBuilder', () => {

  it('builds model', async () => {
    const {validate, buildModel} = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
      element user {
        style {
          shape: person
        }
      }
      tag deprecated
    }
    model {
      user client {
        -> frontend
      }
      component system {
        backend = component 'Backend' {
          style {
            color secondary
          }
        }
        component frontend {
          #deprecated
          style {
            color: muted
            shape: browser
          }

          -> backend 'requests'
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      'client': {
        'kind': 'user',
        'shape': 'person',
      },
      'system.backend': {
        'color': 'secondary',
      },
      'system.frontend': {
        'color': 'muted',
        'shape': 'browser',
      }
    })
    expect(model.elements.client).not.toHaveProperty('color')
    expect(model.elements.system).not.toHaveProperty('color')
    expect(model.elements.system).not.toHaveProperty('shape')
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
        backend = component
        component frontend
      }
    }
    `)
    await parse(`
    model {
      extend system.backend {
        component api
      }
      system.frontend -> api 'requests'
      client -> system.frontend
    }
    `)
    const { errors } = await validateAll()
    expect(errors).toEqual([])
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
    expect(keys(model.relations)).toHaveLength(2)
    expect(model).toMatchSnapshot()
  })

})
