import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'
import { keys } from 'rambdax'
import type { Element, Fqn, ViewID } from '@likec4/core/types'

import '../logger'
vi.mock('../logger')

describe('LikeC4ModelBuilder', () => {
  it('builds model with shapes', async () => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
      element user {
        style {
          shape person
        }
      }
    }
    model {
      customer = user 'Customer'
      component system
      spa = component 'SPA' {
        style {
          shape browser
        }
      }
      mobile = component 'Mobile' {
        style {
          color green
          shape mobile
        }
      }
    }
    `)
    expect(diagnostics).to.be.empty

    const model = await buildModel()
    expect(model).to.be.an('object').and.to.haveOwnProperty('elements')

    const elements = model.elements as Record<string, Element>
    expect(elements).toMatchObject({
      customer: {
        kind: 'user',
        shape: 'person',
        title: 'Customer'
      },
      system: {
        kind: 'component',
        title: 'system'
      },
      spa: {
        kind: 'component',
        shape: 'browser',
        title: 'SPA'
      },
      mobile: {
        kind: 'component',
        shape: 'mobile',
        color: 'green',
        title: 'Mobile'
      }
    })
    // Ignore defaults
    expect(elements['system']).not.toHaveProperty('shape')
    expect(elements['system']).not.toHaveProperty('color')
    expect(elements['customer']).not.toHaveProperty('color')
    expect(elements['spa']).not.toHaveProperty('color')
  })

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

  it('builds model with tags', async () => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
      tag deprecated
    }
    model {
      component system1
      component system2 {
        #deprecated
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      system1: {
        kind: 'component'
      },
      system2: {
        kind: 'component',
        tags: ['deprecated']
      }
    })
    expect(model.elements['system1' as Fqn]).not.toHaveProperty('tags')
  })

  it('builds model and give default name for index view', async () => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element system
    }
    model {
      system system1
    }
    views {
      view index {
        include *
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.views).toHaveProperty('index')

    const indexView = model.views['index' as ViewID]!
    expect(indexView.id).toEqual('index')
    expect(indexView.title).toEqual('Landscape view')
    expect(indexView.nodes).to.be.an('array').that.has.length(1)
    expect(indexView.edges).to.be.an('array').that.is.empty
    expect(indexView.rules).to.be.an('array').that.is.not.empty
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
        autoLayout LeftRight
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
