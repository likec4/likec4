import { type ComputedElementView, invariant } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { attribute as _ } from 'ts-graphviz'
import { describe, it } from 'vitest'
import { ElementViewPrinter } from './ElementViewPrinter'

const builder = Builder
  .specification({
    elements: {
      system: {},
      component: {},
    },
    relationships: {
      subscribes: {},
    },
  })
  .model(({ system, component, rel }, _) =>
    _(
      system('sys').with(
        component('producer'),
        component('consumer'),
      ),
      system('external'),
      rel('sys.producer', 'external', 'sends data'),
    )
  )

function printView(
  b: Builder<any>,
  viewId = 'index',
) {
  const model = b.toLikeC4Model()
  const view = model.view(viewId).$view as ComputedElementView
  const printer = new ElementViewPrinter(view, model.$styles)
  const dot = printer.print()
  const G = printer.G

  const nodeId = (fqn: string) => {
    const node = G.nodes.find(n => n.attributes.get(_.likec4_id) === fqn)
    invariant(node, `node ${fqn} not found`)
    return node.id
  }
  const clusterId = (fqn: string) => {
    const find = (subgraphs: typeof G.subgraphs): string | undefined => {
      for (const s of subgraphs) {
        if (s.get(_.likec4_id) === fqn) {
          return s.id
        }
        const nested = find(s.subgraphs)
        if (nested) {
          return nested
        }
      }
      return undefined
    }
    const id = find(G.subgraphs)
    invariant(id, `cluster ${fqn} not found`)
    return id
  }
  const edge = (likec4Id: string) => {
    const e = G.edges.find(e => e.attributes.get(_.likec4_id) === likec4Id)
    invariant(e, `edge ${likec4Id} not found`)
    const [tail, head] = e.targets.map(t => 'id' in t ? t.id : null)
    return {
      tail,
      head,
      attrs: {
        dir: e.attributes.get(_.dir),
        arrowhead: e.attributes.get(_.arrowhead),
        arrowtail: e.attributes.get(_.arrowtail),
        lhead: e.attributes.get(_.lhead),
        ltail: e.attributes.get(_.ltail),
        minlen: e.attributes.get(_.minlen),
      },
    }
  }
  return { view, dot, nodeId, clusterId, edge }
}

describe('ElementViewPrinter: relationship direction', () => {
  it('prints forward edge as is', ({ expect }) => {
    const { view, nodeId, edge } = printView(
      builder
        .model(({ rel }, _) =>
          _(
            rel('sys.consumer', 'sys.producer', { kind: 'subscribes', title: 'events' }),
          )
        )
        .views(({ view, $include, $autoLayout }, _) =>
          _(
            view('index').with($include('*'), $include('sys.*'), $autoLayout('LR')),
          )
        ),
    )
    const e = view.edges.find(e => e.source === 'sys.consumer')
    invariant(e)
    expect(e.dir).toBeUndefined()
    expect(edge(e.id)).toEqual({
      tail: nodeId('sys.consumer'),
      head: nodeId('sys.producer'),
      attrs: expect.objectContaining({
        dir: undefined,
        arrowhead: 'normal',
      }),
    })
  })

  it('swaps endpoints and sets dir=back', async ({ expect }) => {
    const { view, dot, nodeId, edge } = printView(
      builder
        .model(({ rel }, _) =>
          _(
            rel('sys.consumer', 'sys.producer', { kind: 'subscribes', title: 'events', direction: 'back' }),
          )
        )
        .views(({ view, $include, $autoLayout }, _) =>
          _(
            view('index').with($include('*'), $include('sys.*'), $autoLayout('LR')),
          )
        ),
    )
    const e = view.edges.find(e => e.source === 'sys.consumer')
    invariant(e)
    // semantic direction is kept
    expect(e).toMatchObject({
      source: 'sys.consumer',
      target: 'sys.producer',
      dir: 'back',
    })
    expect(edge(e.id)).toEqual({
      tail: nodeId('sys.producer'),
      head: nodeId('sys.consumer'),
      attrs: {
        dir: 'back',
        arrowtail: 'normal',
        arrowhead: undefined,
        lhead: undefined,
        ltail: undefined,
        minlen: undefined,
      },
    })
    await expect(dot).toMatchFileSnapshot('__snapshots__/ElementViewPrinter-direction-back.dot')
  })

  it('swaps head and tail arrows when both are set', ({ expect }) => {
    const { view, edge } = printView(
      builder
        .model(({ rel }, _) =>
          _(
            rel('sys.consumer', 'sys.producer', { direction: 'back', head: 'diamond', tail: 'crow' }),
          )
        )
        .views(({ view, $include }, _) =>
          _(
            view('index').with($include('*'), $include('sys.*')),
          )
        ),
    )
    const e = view.edges.find(e => e.source === 'sys.consumer')
    invariant(e)
    expect(edge(e.id).attrs).toEqual({
      dir: 'both',
      // arrowtail is drawn at the source (DOT tail is target)
      arrowtail: 'diamond',
      arrowhead: 'crow',
      lhead: undefined,
      ltail: undefined,
      minlen: undefined,
    })
  })

  it('swaps lhead and ltail for compound endpoints', ({ expect }) => {
    const b = builder
      .model(({ rel }, _) =>
        _(
          rel('external', 'sys', { title: 'calls' }),
        )
      )
    const forward = printView(
      b.views(({ view, $include }, _) =>
        _(
          view('index').with($include('sys', 'sys.*', 'external')),
        )
      ),
    )
    const forwardEdge = forward.view.edges.find(e => e.source === 'external' && e.target === 'sys')
    invariant(forwardEdge)
    expect(forward.edge(forwardEdge.id).attrs).toMatchObject({
      lhead: forward.clusterId('sys'),
      ltail: undefined,
    })

    const back = printView(
      b.views(({ view, $include }, _) =>
        _(
          view('index').with(
            $include('sys', 'sys.*', 'external'),
            $include('external -> sys', { with: { direction: 'back' } }),
          ),
        )
      ),
    )
    const backEdge = back.view.edges.find(e => e.source === 'external' && e.target === 'sys')
    invariant(backEdge)
    expect(backEdge.dir).toBe('back')
    const printed = back.edge(backEdge.id)
    expect(printed.head).toBe(back.nodeId('external'))
    expect(printed.attrs).toMatchObject({
      dir: 'back',
      ltail: back.clusterId('sys'),
      lhead: undefined,
    })
  })
})
