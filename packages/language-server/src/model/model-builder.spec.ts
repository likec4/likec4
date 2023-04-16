import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'
import { keys } from 'rambdax'
import type { Fqn, ViewID } from '@likec4/core/types'

describe('LikeC4ModelBuilder', () => {
  it('builds model', async () => {
    const { validate, buildModel } = createTestServices()
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
          technology 'NodeJS'

          style {
            color secondary
          }
        }
        component frontend {
          #deprecated
          description 'Frontend description'

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
      client: {
        kind: 'user',
        shape: 'person'
      },
      'system.backend': {
        color: 'secondary',
        title: 'Backend',
        technology: 'NodeJS'
      },
      'system.frontend': {
        color: 'muted',
        shape: 'browser',
        description: 'Frontend description'
      }
    })
    expect(model.elements['client' as Fqn]).not.toHaveProperty('color')
    expect(model.elements['system' as Fqn]).not.toHaveProperty('color')
    expect(model.elements['system' as Fqn]).not.toHaveProperty('shape')
    expect(model.elements['system.backend' as Fqn]).toHaveProperty('color', 'secondary')
    expect(model.elements['system.backend' as Fqn]).not.toHaveProperty('description')

    expect(model).toMatchSnapshot()
  })

  it('builds model with extend', async () => {
    const { parse, validateAll, buildModel } = createTestServices()
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
      client -> system.frontend {
        title 'opens'
      }
    }
    views {
      view index {
        title 'Index'
        include *
      }

      view v1 of api {
        include *
        autoLayout LR
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
      client: {
        kind: 'user'
      },
      'system.backend.api': {
        kind: 'component'
      }
    })
    expect(keys(model.relations)).toHaveLength(2)

    expect(keys(model.views)).toHaveLength(3)
    expect(model.views).toMatchObject({
      index: {
        id: 'index',
        title: 'Index',
        autoLayout: 'TB'
      },
      v1: {
        id: 'v1',
        viewOf: 'system.backend.api',
        title: 'api',
        autoLayout: 'LR'
      }
    })
    expect(model.views['index' as ViewID]).not.toHaveProperty('viewOf')

    expect(model).toMatchSnapshot()
  })
})
