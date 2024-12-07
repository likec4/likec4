import type { Element, ViewId } from '@likec4/core'
import { viewsWithReadableEdges, withReadableEdges } from '@likec4/core/compute-view'
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
    expect(viewsWithReadableEdges(model)).toMatchSnapshot()
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

    const indexView = model.views['index' as ViewId]!
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
        autoLayout: { direction: 'TB' }
      },
      v1: {
        id: 'v1',
        viewOf: 'system.backend.api',
        title: 'api',
        autoLayout: { direction: 'LR' }
      }
    })
    expect(model.views['index' as ViewId]).not.toHaveProperty('viewOf')

    expect(viewsWithReadableEdges(model)).toMatchSnapshot()
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
    const model = viewsWithReadableEdges(await buildModel())
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
          { url: './samefolder.js', relative: 'src/samefolder.js' },
          { url: './sub/folder.js#L1-2', relative: 'src/sub/folder.js#L1-2' },
          { url: '../dir/another.js?query=1', relative: 'dir/another.js?query=1' },
          { url: '/workspace-root', relative: 'workspace-root' },
          { url: '/root/another.js#L2', relative: 'root/another.js#L2' },
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
          { url: './samefolder.html', relative: 'src/samefolder.html' }
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
          { url: './samefolder.js', relative: 'src/samefolder.js' },
          { url: './sub/folder.js#L1-2', relative: 'src/sub/folder.js#L1-2' },
          { url: '../dir/another.js', relative: 'dir/another.js' },
          { url: '/workspace-root' }
        ]
      },
      sys2: {
        links: [
          { url: './samefolder.c4', relative: 'src/subdir/samefolder.c4' },
          { url: '../sys2.c4', relative: 'src/sys2.c4' },
          { url: '/workspace-root' }
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: [{ url: './samefolder.c4', relative: 'src/samefolder.c4' }],
      // docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: 'index.c4'
    })
    expect(views['sys2']).toMatchObject({
      links: [{ relative: 'src/subdir/doc2.html' }],
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
        links: [{ relative: 'src/samefolder.c4' }]
      },
      sys2: {
        links: [
          { relative: 'src/subdir/samefolder.c4' },
          { relative: 'src/sys2.c4' }
        ]
      },
      sys3: {
        links: [
          { relative: 'src/a/b/c/samefolder.c4' },
          { relative: 'src/sys3.c4' }
        ]
      }
    })
    const views = model.views as Record<string, any>
    expect(views['index']).toMatchObject({
      links: [{ relative: 'src/samefolder.c4' }],
      // docUri: 'vscode-vfs://host/virtual/src/index.c4',
      relativePath: 'index.c4'
    })
    expect(views['index']).not.toHaveProperty('docUri')
    expect(views['sys2']).toMatchObject({
      links: [{ relative: 'src/subdir/doc2.html' }],
      // docUri: 'vscode-vfs://host/virtual/src/subdir/doc2.c4',
      relativePath: 'subdir/doc2.c4'
    })
    expect(views['sys3']).toMatchObject({
      links: [{ relative: 'src/a/b/c/sys3/index.html' }],
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
    expect(viewsWithReadableEdges(model)).toMatchSnapshot()
  })

  it('builds model with relationship spec with technology', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element person
      relationship async {
        technology 'Async'
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
    expect(viewsWithReadableEdges(model)).toMatchSnapshot()
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
    expect(viewsWithReadableEdges(model)).toMatchSnapshot()
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
    const indexView = await services.likec4.ModelBuilder.computeView('index' as ViewId)
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

    system1Node = views['index' as ViewId]!.nodes.find(n => n.id === 'system1')!
    expect(system1Node).toBeDefined()
    expect(system1Node.description).toEqual('Custom description')
    expect(system1Node.navigateTo).toEqual('index')
    expect(system1Node.color).toEqual('amber')

    const system2Node = views['system1' as ViewId]!.nodes.find(n => n.id === 'system2')
    expect(system2Node).toMatchObject({
      title: 'Custom',
      navigateTo: 'system1'
    })
  })

  it('builds model and dynamic view with notes', async ({ expect }) => {
    const { validate, buildModel, services } = createTestServices()
    const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component system1
      component system2
      component system3
    }
    views {
      dynamic view index {
       system1 -> system2
       parallel {
         system1 -> system3 "label1" {
           notes "Note 1"
         }
         system2 -> system3 {
           notes "Note 2"
         }
       }
      }
    }
    `)
    expect(diagnostics).toHaveLength(0)

    // Check that computeView method does not change navigateTo
    const indexView = await services.likec4.ModelBuilder.computeView('index' as ViewId)
    const [step1, step2, step3] = indexView!.edges

    expect(step1).not.toHaveProperty('notes')
    expect(step1).toHaveProperty('label', null)

    expect(step2).toHaveProperty('notes', 'Note 1')
    expect(step2).toHaveProperty('label', 'label1')

    expect(step3).toHaveProperty('notes', 'Note 2')
    expect(step3).toHaveProperty('label', null)
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
        { url: './samefolder.html', relative: 'src/samefolder.html' },
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
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView).toHaveProperty('manualLayout', {
      autoLayout: { direction: 'TB' },
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

  it('parses custom color definitions', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        color custom-color1 #FF00FF
        color custom-color2 #FFFF00

        element component {
          style {
            color custom-color2
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView).toHaveProperty('customColorDefinitions', {
      'custom-color1': {
        elements: {
          fill: '#ff09ff',
          hiContrast: '#ffe8ff',
          loContrast: '#ffceff',
          stroke: '#e400e4'
        },
        relationships: {
          labelBgColor: '#b100b2',
          labelColor: '#ff64ff',
          lineColor: '#fe37fe'
        }
      },
      'custom-color2': {
        elements: {
          fill: '#ffff09',
          hiContrast: '#ffffe1',
          loContrast: '#ffffcc',
          stroke: '#e3e300'
        },
        relationships: {
          labelBgColor: '#adae00',
          labelColor: '#ffff64',
          lineColor: '#ffff38'
        }
      }
    })
  })

  it('allows custom colors in spec', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component {
          style {
            color custom-color1
          }
        }

        relationship uses {
          color custom-color1
        }

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -[uses]-> sys2
      }
      views {
        view {
          include *
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.edges[0]?.color).toBe('custom-color1')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('custom-color1')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('custom-color1')
  })

  it('allows custom colors in relationships', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2 {
          style {
            color custom-color1
          }
        }
      }
      views {
        view {
          include *
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.edges[0]?.color).toBe('custom-color1')
  })

  it('allows custom colors in include expressions of view', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component

        color custom-color1 #FF00FF
      }
      model {
        component sys1
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1 with {
            color custom-color1
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('custom-color1')
  })

  it('local styles are applied to all views', async ({ expect }) => {
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
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        style * {
          color green
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View).toBeDefined()
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('local styles are overwritten by internal view styles', async ({ expect }) => {
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
        view index {
          include sys1

          style * {
            color red
          }
        }

        view sys2 {
          include sys2
        }

        style * {
          color green
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('red')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View).toBeDefined()
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('global style is applied to a view', async ({ expect }) => {
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
        view index {
          include sys1
          global style style_name
        }
      }
      global {
        style style_name * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)

    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style is overridden by further styles', async ({ expect }) => {
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
        view index {
          include sys1
          global style style_id
          style element.kind=component {
            color red
          }
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('red')
  })

  it('global style overrides previous styles', async ({ expect }) => {
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
        view index {
          include sys1
          style element.kind=component {
            color red
          }
          global style style_id
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style is not applied if not defined', async ({ expect }) => {
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
        view index {
          include sys1

          global style missing_style_id
        }
      }
      global {
        style style_id * {
          color green
        }
      }
    `)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.severity).toBe(1)

    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('primary')
  })

  it('the first global style with duplicated name is applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag element_tag
      }
      model {
        component sys1 {
          #element_tag
        }
        component sys2
        sys1 -> sys2
      }
      views {
        view index {
          include sys1
          global style repeated_style_id
        }
      }
      global {
        style repeated_style_id * {
          color green
        }
        style repeated_style_id element.tag = #element_tag {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style group is applied to a view', async ({ expect }) => {
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
        view index {
          include sys1
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('global style group can be filtered on tags', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include *
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
          style element.tag = #deprecated {
            color muted
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('muted')
  })

  it('global style group entreis are applied in order', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include *
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style element.tag = #deprecated {
            color muted
          }
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('global style group is overwritten by further styles', async ({ expect }) => {
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
        view index {
          include sys1
          global style style_group_name
          style * {
            color secondary
          }
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
            opacity 10%
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('secondary')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.style.opacity).toBe(10)
  })

  it('global style group overwrites previous styles', async ({ expect }) => {
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
        view index {
          include sys1

          style * {
            color secondary
            opacity 50%
          }
          global style style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.style.opacity).toBe(50)
  })

  it('global style group is not applied if missing', async ({ expect }) => {
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
        view index {
          include sys1

          style * {
            color secondary
          }
          global style missing_style_group_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
          }
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('secondary')
  })

  it('global style group can be applied with a global style', async ({ expect }) => {
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
        view index {
          include sys1

          global style style_group_name
          global style style_name
        }
      }
      global {
        styleGroup style_group_name {
          style * {
            color green
            opacity 70%
          }
        }
        style style_name * {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('red')
    expect(indexView.nodes.find(n => n.id === 'sys1')?.style.opacity).toBe(70)
  })

  it('global style group should not share a name with a global style', async ({ expect }) => {
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
        view index {
          include sys1

          global style repeated_style_name
        }
      }
      global {
        styleGroup repeated_style_name {
          style * {
            color green
          }
        }
        style repeated_style_name * {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBeGreaterThan(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')
  })

  it('local styles can apply global styles', async ({ expect }) => {
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
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_name
      }
      global {
        style global_style_name * {
          color amber
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('amber')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('amber')
  })

  it('local styles can apply global style groups', async ({ expect }) => {
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
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_group_name
      }
      global {
        styleGroup global_style_group_name {
          style * {
            color amber
          }
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('amber')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('amber')
  })

  it('local styles are applied in order', async ({ expect }) => {
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
        view index {
          include sys1
        }

        view sys2 {
          include sys2
        }

        global style global_style_red
        global style global_style_green
      }
      global {
        style global_style_green * {
          color green
        }

        style global_style_red * {
          color red
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('green')

    const sys2View = model?.views['sys2' as ViewId]!
    expect(sys2View.nodes.find(n => n.id === 'sys2')?.color).toBe('green')
  })

  it('includes both sides of inout relation', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
          element sys
          tag tobe
      }
      model {
          sys sys1
          sys sys2
          sys sys3

          sys1 -> sys2 {
              #tobe
          }
          sys2 -> sys3
      }
      views {
          view index {
              include
                  *,
                  -> sys2 -> where tag is #tobe with {
                      color red
                  },
                  -> sys2 -> where tag is not #tobe with {
                      color green
                  }
          }
      }
    `)
    expect(diagnostics.length).toBe(0)

    const indexView = withReadableEdges((await services.likec4.ModelBuilder.computeView('index' as ViewId))!)

    expect(indexView.nodes.map(x => x.id)).toStrictEqual(['sys1', 'sys2', 'sys3'])
    expect(indexView.edges.map(x => [x.id, x.color])).toStrictEqual([['sys1:sys2', 'red'], ['sys2:sys3', 'green']])
  })

  it('global predicate groups are applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag deprecated
      }
      model {
        component sys1
        component sys2 {
          #deprecated
        }
        sys1 -> sys2
      }
      views {
        view index {
          include *
          global predicate global_predicate_group_name
        }
      }
      global {
        predicateGroup global_predicate_group_name {
          exclude * where tag is #deprecated
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const indexView = model?.views['index' as ViewId]!
    expect(indexView).toBeDefined()
    expect(indexView.nodes.find(n => n.id === 'sys1')?.color).toBe('primary')
    expect(indexView.nodes.find(n => n.id === 'sys2')).toBeUndefined()
  })

  it('global dynamic predicate groups are applied', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    const { diagnostics } = await validate(`
      specification {
        element component
        tag important
      }
      model {
        component sys1
        component sys2
        component sys3 {
          #important
        }
        sys1 -> sys2
      }
      views {
        dynamic view dynamic_view {
          sys1 -> sys2 'performs an action'
          global predicate global_predicate_group_name
        }
      }
      global {
        dynamicPredicateGroup global_predicate_group_name {
          include sys3
        }
      }
    `)
    expect(diagnostics.length).toBe(0)
    const model = await buildModel()
    const dynamicView = model?.views['dynamic_view' as ViewId]!
    expect(dynamicView).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys1')).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys2')).toBeDefined()
    expect(dynamicView.nodes.find(n => n.id === 'sys3')).toBeDefined()
  })
})
