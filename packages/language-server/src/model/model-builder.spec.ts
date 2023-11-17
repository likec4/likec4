import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'
import { keys, values } from 'rambdax'
import type { Element, ViewID } from '@likec4/core'

vi.mock('../logger')

describe('LikeC4ModelBuilder', () => {
  it.concurrent('builds model with colors and shapes', async ({ expect }) => {
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
    expect(elements['customer']).not.toHaveProperty('color')
    expect(elements['system']).not.toHaveProperty('shape')
    expect(elements['system']).not.toHaveProperty('color')
  })

  it('builds model with description and technology', async ({ expect }) => {
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
      'client': {
        kind: 'user',
        shape: 'person',
        description: null,
        technology: null
      },
      'system.backend': {
        color: 'secondary',
        title: 'Backend',
        description: null,
        technology: 'NodeJS'
      },
      'system.frontend': {
        color: 'muted',
        shape: 'browser',
        description: 'Frontend description',
        technology: null
      }
    })
    expect(model).toMatchSnapshot()
  })

  it.concurrent('builds model with tags', async ({ expect }) => {
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
        kind: 'component',
        tags: null
      },
      system2: {
        kind: 'component',
        tags: ['deprecated']
      }
    })
  })

  it.concurrent('builds model with icon', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
      element system {
        style {
          icon https://system1.png
        }
      }
    }
    model {
      system system1
      system system2 {
        // override icon
        style {
          icon https://system2.png
        }
      }
      component component1 {
        style {
          icon https://component.png
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toHaveProperty('elements', expect.any(Object))
    expect(model.elements).toMatchObject({
      system1: {
        kind: 'system',
        icon: 'https://system1.png'
      },
      system2: {
        kind: 'system',
        icon: 'https://system2.png'
      },
      component1: {
        kind: 'component',
        icon: 'https://component.png'
      }
    })
  })

  it.concurrent('builds model and give default name for index view', async ({ expect }) => {
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
  })

  it.concurrent('builds model with extend', async ({ expect }) => {
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

        view frontend of system.frontend {
          include *
        }
      }
    `)
    const { errors } = await validateAll()
    expect(errors).to.be.empty
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      'client': {
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

  it.concurrent('builds model and views with links', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics, document } = await validate(`
    specification {
      element component
      tag v2
    }
    model {
      component system1 {
        #v2
      }
      component system2 {
        link ./samefolder.js
        link ./sub/folder.js#L1-2
        link ../dir/another.js
        link /workspace-root

        link https://example1.com

        -> system1
      }
    }
    views {
      view index {
        title 'Index'
        include *
      }
      view withLinks {
        #v2
        description 'View with links'
        link https://example1.com
        link https://example2.com/
        link ./samefolder.html
        include *
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      system1: {
        kind: 'component',
        tags: ['v2'],
        links: null
      },
      system2: {
        kind: 'component',
        tags: null,
        links: [
          'file:///test/workspace/src/samefolder.js',
          'file:///test/workspace/src/sub/folder.js#L1-2',
          'file:///test/workspace/dir/another.js',
          'file:///workspace-root',
          'https://example1.com'
        ]
      }
    })
    expect(model.views).toMatchObject({
      index: {
        id: 'index',
        title: 'Index',
        description: null,
        tags: null,
        links: null,
        docUri: document.uri.toString()
      },
      withLinks: {
        id: 'withLinks',
        title: null,
        description: 'View with links',
        tags: ['v2'],
        links: [
          'https://example1.com',
          'https://example2.com/',
          'file:///test/workspace/src/samefolder.html'
        ],
        docUri: 'file:///test/workspace/src/1.c4'
      }
    })
  })

  it.concurrent('builds model with relative links inside virtual workspace', async ({ expect }) => {
    const { parse, validateAll, buildModel } = createTestServices('vscode-vfs://host/virtual')
    // vscode-vfs://host/virtual/src/index.c4
    await parse(
      `
      specification {
        element component
      }
      model {
        component sys1 {
          link ./samefolder.js
          link ./sub/folder.js#L1-2
          link ../dir/another.js
          link /workspace-root
        }
      }
      views {
        view index {
          link ./samefolder.c4
          include *
        }
      }
    `,
      'index.c4'
    )

    // vscode-vfs://host/virtual/src/subdir/doc2.c4
    await parse(
      `
      model {
        component sys2 {
          link ./samefolder.c4
          link ../sys2.c4
          link /workspace-root
        }
      }
      views {
        view sys2 of sys2 {
          link ./doc2.html
          include *
        }
      }
    `,
      'subdir/doc2.c4'
    )

    const { errors } = await validateAll()

    expect(errors).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      sys1: {
        links: [
          'vscode-vfs://host/virtual/src/samefolder.js',
          'vscode-vfs://host/virtual/src/sub/folder.js#L1-2',
          'vscode-vfs://host/virtual/dir/another.js',
          'vscode-vfs://host/workspace-root'
        ]
      },
      sys2: {
        links: [
          'vscode-vfs://host/virtual/src/subdir/samefolder.c4',
          'vscode-vfs://host/virtual/src/sys2.c4',
          'vscode-vfs://host/workspace-root'
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: ['vscode-vfs://host/virtual/src/samefolder.c4'],
      docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: ''
    })
    expect(views['sys2']).toMatchObject({
      links: ['vscode-vfs://host/virtual/src/subdir/doc2.html'],
      docUri: 'vscode-vfs://host/virtual/src/subdir/doc2.c4',
      relativePath: 'subdir'
    })
  })

  it.concurrent('build model and views have correct relative paths', async ({ expect }) => {
    const { parse, validateAll, buildModel } = createTestServices('vscode-vfs://host/virtual')
    // vscode-vfs://host/virtual/src/index.c4
    await parse(
      `
      specification {
        element component
      }
      model {
        component sys1 {
          link ./samefolder.c4
        }
      }
      views {
        view index {
          link ./samefolder.c4
          include *
        }
      }
    `,
      'index.c4'
    )

    // vscode-vfs://host/virtual/src/subdir/doc2.c4
    await parse(
      `
      model {
        component sys2 {
          link ./samefolder.c4
          link ../sys2.c4
        }
      }
      views {
        view sys2 of sys2 {
          link ./doc2.html
          include *
        }
      }
    `,
      'subdir/doc2.c4'
    )

    // vscode-vfs://host/virtual/src/a/b/c/doc3.c4
    await parse(
      `
      model {
        component sys3 {
          link ./samefolder.c4
          link ../../../sys3.c4
        }
      }
      views {
        view sys3 of sys3 {
          link ./sys3/index.html
          include *
        }
      }
    `,
      'a/b/c/doc3.c4'
    )

    const { errors } = await validateAll()

    expect(errors).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(model.elements).toMatchObject({
      sys1: {
        links: ['vscode-vfs://host/virtual/src/samefolder.c4']
      },
      sys2: {
        links: [
          'vscode-vfs://host/virtual/src/subdir/samefolder.c4',
          'vscode-vfs://host/virtual/src/sys2.c4'
        ]
      },
      sys3: {
        links: [
          'vscode-vfs://host/virtual/src/a/b/c/samefolder.c4',
          'vscode-vfs://host/virtual/src/sys3.c4'
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: ['vscode-vfs://host/virtual/src/samefolder.c4'],
      docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: ''
    })
    expect(views['sys2']).toMatchObject({
      links: ['vscode-vfs://host/virtual/src/subdir/doc2.html'],
      docUri: 'vscode-vfs://host/virtual/src/subdir/doc2.c4',
      relativePath: 'subdir'
    })
    expect(views['sys3']).toMatchObject({
      links: ['vscode-vfs://host/virtual/src/a/b/c/sys3/index.html'],
      docUri: 'vscode-vfs://host/virtual/src/a/b/c/doc3.c4',
      relativePath: 'a/b/c'
    })
  })

  it('builds model with relationship spec', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
      relationship async

    }
    model {
      person user1
      person user2

      user1 -[async]-> user2
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(values(model.relations)[0]).toMatchObject({
      source: 'user1',
      target: 'user2',
      kind: 'async'
    })
    expect(model).toMatchSnapshot()
  })

  it.concurrent('builds model and view with customized element', async ({ expect }) => {
    const { validate, buildModel, services } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2 {
        -> system1
      }
    }
    views {
      view index {
        include *,
          system1 with {
            description 'Custom description'
            navigateTo index
            color amber
          }
      }
      view system1 of system1 {
        include *,
          system2 with {
            title 'Custom'
            navigateTo system1
          }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)

    // Check that computeView method does not change navigateTo
    const indexView = services.likec4.ModelBuilder.computeView('index' as ViewID)!
    let system1Node = indexView.nodes.find(n => n.id === 'system1')
    expect(system1Node).toMatchObject({
      title: 'system1',
      description: 'Custom description',
      navigateTo: 'index'
    })

    // Check buildModel
    const { views } = await buildModel()
    expect(views).toHaveProperty('index')
    expect(views).toHaveProperty('system1')

    system1Node = views['index' as ViewID]!.nodes.find(n => n.id === 'system1')!
    expect(system1Node).toBeDefined()
    expect(system1Node.description).toEqual('Custom description')
    expect(system1Node.navigateTo).toEqual('index')
    expect(system1Node.color).toEqual('amber')

    const system2Node = views['system1' as ViewID]!.nodes.find(n => n.id === 'system2')
    expect(system2Node).toMatchObject({
      title: 'Custom',
      navigateTo: 'system1'
    })
  })
})
