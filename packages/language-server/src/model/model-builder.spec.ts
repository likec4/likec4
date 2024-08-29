import type { Element, ViewID } from '@likec4/core'
import { keys, values } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('LikeC4ModelBuilder', () => {
  it('builds model with colors and shapes', async ({ expect }) => {
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
          shape person
          opacity 40%
        }
      }
    }
    model {
      user client
      component system {
        backend = component 'Backend' {
          technology 'NodeJS'

          style {
            color secondary
            border dashed
          }
        }
        component frontend {
          description 'Frontend description'

          style {
            color: muted
            shape: browser
          }

          this -> backend 'requests'

          client -> it
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

  it('builds model with tags', async ({ expect }) => {
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

  it('builds model with metadata', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2 {
        metadata {
          version '1.1.1'
        }
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
        metadata: {
          version: '1.1.1'
        }
      }
    })
  })

  it('builds model with icon', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { errors, warnings } = await validate(`
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
          icon tech:react
        }
      }
      system system3 {
        // override icon
        icon tech:astro
      }
      component component1 {
        icon https://component.png
        style {
          icon https://ignored.png
        }
      }
    }
    `)
    expect(errors).toHaveLength(0)
    expect(warnings).toEqual([
      'Redundant as icon defined on element'
    ])
    const model = await buildModel()
    expect(model).toHaveProperty('elements', expect.any(Object))
    expect(model.elements).toMatchObject({
      system1: {
        kind: 'system',
        icon: 'https://system1.png'
      },
      system2: {
        kind: 'system',
        icon: 'tech:react'
      },
      system3: {
        kind: 'system',
        icon: 'tech:astro'
      },
      component1: {
        kind: 'component',
        icon: 'https://component.png'
      }
    })
  })

  it('builds model and give default name for index view', async ({ expect }) => {
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

  it('builds model with extend', async ({ expect }) => {
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

  it('builds model and views with links', async ({ expect }) => {
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
        link ../dir/another.js?query=1
        link /workspace-root
        link /root/another.js#L2

        link https://example1.com 'component link title'

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
        link https://example2.com/ 'view link title'
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
          { url: 'file:///test/workspace/src/samefolder.js' },
          { url: 'file:///test/workspace/src/sub/folder.js#L1-2' },
          { url: 'file:///test/workspace/dir/another.js?query=1' },
          { url: 'file:///test/workspace/workspace-root' },
          { url: 'file:///test/workspace/root/another.js#L2' },
          { url: 'https://example1.com', title: 'component link title' }
        ]
      }
    })
    expect(model.views).toMatchObject({
      index: {
        id: 'index',
        title: 'Index',
        description: null,
        tags: null,
        links: null
        // docUri: document.uri.toString()
      },
      withLinks: {
        id: 'withLinks',
        title: null,
        description: 'View with links',
        tags: ['v2'],
        links: [
          { url: 'https://example1.com' },
          { url: 'https://example2.com/', title: 'view link title' },
          { url: 'file:///test/workspace/src/samefolder.html' }
        ]
        // docUri: 'file:///test/workspace/src/1.c4'
      }
    })
  })

  it('builds model with relative links inside virtual workspace', async ({ expect }) => {
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
          { url: 'vscode-vfs://host/virtual/src/samefolder.js' },
          { url: 'vscode-vfs://host/virtual/src/sub/folder.js#L1-2' },
          { url: 'vscode-vfs://host/virtual/dir/another.js' },
          { url: 'vscode-vfs://host/virtual/workspace-root' }
        ]
      },
      sys2: {
        links: [
          { url: 'vscode-vfs://host/virtual/src/subdir/samefolder.c4' },
          { url: 'vscode-vfs://host/virtual/src/sys2.c4' },
          { url: 'vscode-vfs://host/virtual/workspace-root' }
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: [{ url: 'vscode-vfs://host/virtual/src/samefolder.c4' }],
      // docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: 'index.c4'
    })
    expect(views['sys2']).toMatchObject({
      links: [{ url: 'vscode-vfs://host/virtual/src/subdir/doc2.html' }],
      // docUri: 'vscode-vfs://host/virtual/src/subdir/doc2.c4',
      relativePath: 'subdir/doc2.c4'
    })
  })

  it('build model and views have correct relative paths', async ({ expect }) => {
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
        links: [{ url: 'vscode-vfs://host/virtual/src/samefolder.c4' }]
      },
      sys2: {
        links: [
          { url: 'vscode-vfs://host/virtual/src/subdir/samefolder.c4' },
          { url: 'vscode-vfs://host/virtual/src/sys2.c4' }
        ]
      },
      sys3: {
        links: [
          { url: 'vscode-vfs://host/virtual/src/a/b/c/samefolder.c4' },
          { url: 'vscode-vfs://host/virtual/src/sys3.c4' }
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: [{ url: 'vscode-vfs://host/virtual/src/samefolder.c4' }],
      // docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: 'index.c4'
    })
    expect(views['index']).not.toHaveProperty('docUri')
    expect(views['sys2']).toMatchObject({
      links: [{ url: 'vscode-vfs://host/virtual/src/subdir/doc2.html' }],
      // docUri: 'vscode-vfs://host/virtual/src/subdir/doc2.c4',
      relativePath: 'subdir/doc2.c4'
    })
    expect(views['sys3']).toMatchObject({
      links: [{ url: 'vscode-vfs://host/virtual/src/a/b/c/sys3/index.html' }],
      // docUri: 'vscode-vfs://host/virtual/src/a/b/c/doc3.c4',
      relativePath: 'a/b/c/doc3.c4'
    })
  })

  it('builds model with relationship spec and tag', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
      relationship async
      tag next
    }
    model {
      person user1
      person user2

      user1 -[async]-> user2 #next
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(values(model.relations)[0]).toMatchObject({
      source: 'user1',
      target: 'user2',
      kind: 'async',
      tags: ['next']
    })
    expect(model).toMatchSnapshot()
  })

  it('builds model with relationship spec with technology', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
      relationship async {
        technology "Async"
      }
    }
    model {
      person user1
      person user2

      user1 .async user2
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(values(model.relations)[0]).toMatchObject({
      source: 'user1',
      target: 'user2',
      kind: 'async',
      technology: 'Async'
    })
    expect(model).toMatchSnapshot()
  })

  it('builds model with styled relationship', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
    }
    model {
      person user1
      person user2
      user1 -> user2 {
        style {
          color red
          line dotted
          head diamond
          tail none
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    const edge = values(model.relations)[0]
    expect(edge).toMatchObject({
      title: '',
      source: 'user1',
      target: 'user2',
      color: 'red',
      line: 'dotted',
      head: 'diamond',
      tail: 'none'
    })
    expect(edge).not.toHaveProperty('description')
    expect(edge).not.toHaveProperty('technology')
    expect(model).toMatchSnapshot()
  })

  it('builds model with relationship with properties', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
    }
    model {
      person user1
      person user2
      user1 -> user2 {
        title 'calls'
        technology 'NodeJS'
        description 'description'
        style {
          color red
          line dotted
          head diamond
          tail none
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    expect(values(model.relations)[0]).toMatchObject({
      source: 'user1',
      target: 'user2',
      title: 'calls',
      technology: 'NodeJS',
      description: 'description',
      color: 'red',
      line: 'dotted',
      head: 'diamond',
      tail: 'none'
    })
  })

  it('builds model and view with customized element', async ({ expect }) => {
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
    const indexView = await services.likec4.ModelBuilder.computeView('index' as ViewID)
    let system1Node = indexView!.nodes.find(n => n.id === 'system1')
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

  it('builds relations with links', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2 {
        -> system1 {
          link ./samefolder.html
          link https://example1.com 'example 1'
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    const relations = values(model.relations)
    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      source: 'system2',
      target: 'system1',
      links: [
        { url: 'file:///test/workspace/src/samefolder.html' },
        { url: 'https://example1.com', title: 'example 1' }
      ]
    })
  })

  it('builds relations with metadata', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2 {
        -> system1 {
          metadata {
            rps '100'
            messageSize '10'
          }
        }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    const relations = values(model.relations)
    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      source: 'system2',
      target: 'system1',
      metadata: {
        rps: '100',
        messageSize: '10'
      }
    })
  })

  it('builds relations with technology', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2 {
        -> system1 'uses' 'http'
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    expect(model).toBeDefined()
    const relations = values(model.relations)
    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      source: 'system2',
      target: 'system1',
      title: 'uses',
      technology: 'http'
    })
  })

  // Base64 taken from saveManualLayout.spec.ts
  it('parses manual layout', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        /**
         * @likec4-generated(v1)
         * iKRoYXNopGhhc2iqYXV0b0xheW91dKJUQqF49qF57KZoZWlnaHRkpXdpZHRozMilbm9kZXOBpHN5czGCoWKUAABkZKFjwqVlZGdlc4GlZWRnZTGComNwkYKheAqheQqhcJKSAACSZGQ=
         */
        view index {
          include *
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewID]!
    expect(indexView).toBeDefined()
    expect(indexView).toHaveProperty('manualLayout', {
      autoLayout: 'TB',
      hash: 'hash',
      x: -10,
      y: -20,
      height: 100,
      width: 200,
      nodes: {
        'sys1': { x: 0, y: 0, width: 100, height: 100, isCompound: false }
      },
      edges: {
        'edge1': {
          points: [[0, 0], [100, 100]],
          controlPoints: [{ x: 10, y: 10 }]
        }
      }
    })
  })
})
