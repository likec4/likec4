import type { LayoutedView } from '@likec4/core'
import { fromSources } from '@likec4/language-services/node'
import type { ExpectStatic } from 'vitest'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

const model = `
  specification {
    element component
  }
  model {
    a = component 'A'
    b = component 'B'
    c = component 'C'
    a -> b 'uses'
    b -> c 'calls'
  }
`

describe('view routing', () => {
  it('resolves routing ortho from the view property and omits it for spline', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      ${model}
      views {
        view ortho {
          routing ortho
          include *
        }
        view curved {
          routing: spline
          include *
        }
        view untouched {
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('ortho').$view.routing).toBe('ortho')
    expect(m.view('curved').$view).not.toHaveProperty('routing')
    expect(m.view('untouched').$view).not.toHaveProperty('routing')
  })

  it('accepts routing as autoLayout sugar, property wins over sugar', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      ${model}
      views {
        view sugar {
          include *
          autoLayout TopBottom ortho
        }
        view sugarWithSpacing {
          include *
          autoLayout LeftRight 120 110 ortho
        }
        view propertyWins {
          routing spline
          include *
          autoLayout TopBottom ortho
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('sugar').$view.routing).toBe('ortho')
    expect(m.view('sugarWithSpacing').$view).toMatchObject({
      routing: 'ortho',
      autoLayout: { direction: 'LR', rankSep: 120, nodeSep: 110 },
    })
    expect(m.view('propertyWins').$view).not.toHaveProperty('routing')
  })

  it('applies the project default from likec4.config and lets a view override it', async ({ expect }) => {
    const likec4 = await fromSources({
      'likec4.config.json': JSON.stringify({
        name: 'routing-test',
        styles: { defaults: { view: { routing: 'ortho' } } },
      }),
      'model.c4': `
        ${model}
        views {
          view byDefault {
            include *
          }
          view overridden {
            routing spline
            include *
          }
        }
      `,
    })
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('byDefault').$view.routing).toBe('ortho')
    expect(m.view('overridden').$view).not.toHaveProperty('routing')
  })

  it('changes the view layout hash when routing flips, but not for an explicit spline', async ({ expect }) => {
    const hashOf = async (viewBody: string) => {
      const likec4 = await LikeC4.fromSource(`
        ${model}
        views {
          view index {
            ${viewBody}
            include *
          }
        }
      `)
      expect(likec4.hasErrors()).toBe(false)
      const m = await likec4.computedModel()
      return m.view('index').$view.hash
    }
    const plain = await hashOf('')
    const spline = await hashOf('routing spline')
    const ortho = await hashOf('routing ortho')
    expect(spline).toEqual(plain)
    expect(ortho).not.toEqual(plain)
  })

  it('applies to dynamic and deployment views', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        deploymentNode node
      }
      model {
        a = component 'A'
        b = component 'B'
        a -> b 'uses'
      }
      deployment {
        node prod {
          instanceOf a
          instanceOf b
        }
      }
      views {
        dynamic view flow {
          routing ortho
          a -> b 'calls'
        }
        dynamic view flowSugar {
          a -> b 'calls'
          autoLayout LeftRight ortho
        }
        deployment view deployed {
          routing: ortho
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)
    const m = await likec4.layoutedModel()
    expect(m.view('flow').$view.routing).toBe('ortho')
    expect(m.view('flowSugar').$view.routing).toBe('ortho')
    expect(m.view('deployed').$view.routing).toBe('ortho')
  })

  describe('ortho layout', () => {
    const near = (a: number, b: number) => Math.abs(a - b) <= 1
    const expectOrthoEdges = (
      expect: ExpectStatic,
      view: LayoutedView,
    ) => {
      expect(view.edges.length).toBeGreaterThan(0)
      for (const edge of view.edges) {
        const pts = edge.points
        expect((pts.length - 1) % 3, `edge ${edge.id} points`).toBe(0)
        for (let i = 0; i + 3 < pts.length; i += 3) {
          const [ax, ay] = pts[i]!
          const [bx, by] = pts[i + 3]!
          expect(near(ax, bx) || near(ay, by), `edge ${edge.id} segment ${i / 3} is axis-aligned`).toBe(true)
        }
        if (edge.label) {
          expect(edge.labelBBox, `edge ${edge.id} keeps its label`).toBeTruthy()
        }
      }
    }

    it('routes every edge orthogonally and keeps every label', async ({ expect }) => {
      const likec4 = await LikeC4.fromSource(`
        specification {
          element component
          deploymentNode node
        }
        model {
          component cloud {
            component ui 'UI'
            component api 'API'
            component worker 'Worker'
            ui -> api 'fetches'
            api -> worker 'enqueues'
          }
          component amazon {
            component db 'DB'
            component replica 'Replica'
            db -> replica 'replicates'
          }
          cloud.api -> amazon.db 'reads and writes'
          cloud.worker -> amazon.db 'writes'
          cloud -> amazon 'uses'
        }
        deployment {
          node prod {
            instanceOf cloud.ui
            instanceOf cloud.api
            instanceOf amazon.db
          }
        }
        views {
          view cloud of cloud {
            routing ortho
            include *, amazon.*
            // flat same-rank edge: Graphviz drops its label under ortho unless it is an xlabel
            rank same { amazon.db, amazon.replica }
          }
          dynamic view flow {
            routing ortho
            cloud.ui -> cloud.api 'request'
            cloud.api -> cloud.api 'retries'
            cloud.api -> amazon.db 'query'
          }
          deployment view deployed {
            routing ortho
            include *
          }
        }
      `)
      expect(likec4.hasErrors()).toBe(false)
      const m = await likec4.layoutedModel()
      const cloud = m.view('cloud').$view
      const flat = cloud.edges.find(e => e.label === 'replicates')
      expect(flat?.labelBBox, 'flat same-rank edge keeps its label').toBeTruthy()
      expectOrthoEdges(expect, cloud)
      expectOrthoEdges(expect, m.view('flow').$view)
      expectOrthoEdges(expect, m.view('deployed').$view)
    })

    it('keeps a label off the boxes of its own endpoints when the gap can hold it', async ({ expect }) => {
      const likec4 = await LikeC4.fromSource(`
        specification {
          element component
        }
        model {
          a = component 'A'
          b = component 'B'
          a -> b 'a label that is wider than the gap between the two boxes'
        }
        views {
          // vertical edge, gap just tall enough for the label
          view tall {
            routing ortho
            include *
            autoLayout TopBottom 48
          }
          // horizontal edge, gap wide enough for the label but Graphviz starts it at the midpoint
          view wide {
            routing ortho
            include *
            autoLayout LeftRight 300
          }
        }
      `)
      expect(likec4.hasErrors()).toBe(false)
      const m = await likec4.layoutedModel()
      const overlaps = (
        bbox: { x: number; y: number; width: number; height: number },
        r: { x: number; y: number; width: number; height: number },
      ) =>
        !(bbox.x + bbox.width <= r.x || r.x + r.width <= bbox.x || bbox.y + bbox.height <= r.y ||
          r.y + r.height <= bbox.y)
      for (const viewId of ['tall', 'wide']) {
        const view = m.view(viewId).$view
        const edge = view.edges[0]!
        const bbox = edge.labelBBox
        expect(bbox, `${viewId}: label box`).toBeTruthy()
        for (const id of [edge.source, edge.target]) {
          const node = view.nodes.find(n => n.id === id)!
          expect(overlaps(bbox!, node), `${viewId}: label overlaps ${id}`).toBe(false)
        }
      }
      // spline views are not touched: the layouts package pins their output byte for byte
      // in the GraphvizWasmAdapter snapshots, which are unchanged by the nudge
    })
  })
})
