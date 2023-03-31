import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'
import { keys } from 'rambdax'
import type { Fqn, ViewID } from '@likec4/core/types'

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
    expect(model.elements['client' as Fqn]).not.toHaveProperty('color')
    expect(model.elements['system' as Fqn]).not.toHaveProperty('color')
    expect(model.elements['system.backend' as Fqn]).toHaveProperty('color', 'secondary')
    expect(model.elements['system' as Fqn]).not.toHaveProperty('shape')
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
    views {
      view index {
        title 'Index'
        include *
      }

      view v1 of api {
        include *
      }

      view of system.frontend {
        include *
      }
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

    expect(keys(model.views)).toHaveLength(3)
    expect(model.views).toMatchObject({
      'index': {
        'id': 'index',
        'title': 'Index'
      },
      'v1': {
        'id': 'v1',
        'viewOf': 'system.backend.api',
        'title': 'api'
      }
    })
    expect(model.views['index' as ViewID]).not.toHaveProperty('viewOf')

    expect(model).toMatchSnapshot()
  })

})
