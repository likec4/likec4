import { invariant } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import { GraphvizLayouter } from '../GraphvizLayoter'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

function buildModel(direction?: 'back') {
  return Builder
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
        rel('sys.consumer', 'sys.producer', {
          kind: 'subscribes',
          title: 'events',
          ...(direction && { direction }),
        }),
      )
    )
    .views(({ view, $include, $autoLayout }, _) =>
      _(
        view('index').with(
          $include('*', 'sys.*'),
          $autoLayout('LR'),
        ),
      )
    )
    .toLikeC4Model()
}

async function layoutIndex(model: ReturnType<typeof buildModel>) {
  const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())
  const { diagram } = await layouter.layout({
    view: model.view('index').$view,
    styles: model.$styles,
  })
  const x = (id: string) => {
    const node = diagram.nodes.find(n => n.id === id)
    invariant(node, `node ${id} not found`)
    return node.x
  }
  return { diagram, x }
}

describe('relationship direction layout', () => {
  it('forward: producer is not ranked before consumer', async ({ expect }) => {
    const { x } = await layoutIndex(buildModel())
    expect(x('sys.producer')).toBeGreaterThanOrEqual(x('sys.consumer'))
    expect(x('sys.producer')).toBeLessThan(x('external'))
  })

  it('back: producer is ranked before consumer and external', async ({ expect }) => {
    const { diagram, x } = await layoutIndex(buildModel('back'))
    expect(x('sys.producer')).toBeLessThan(x('sys.consumer'))
    expect(x('sys.producer')).toBeLessThan(x('external'))
    expect(x('external')).toBeGreaterThanOrEqual(x('sys.consumer'))

    const edge = diagram.edges.find(e => e.source === 'sys.consumer')
    invariant(edge)
    expect(edge).toMatchObject({
      source: 'sys.consumer',
      target: 'sys.producer',
      dir: 'back',
    })
    // Points are in drawing order (from target to source)
    const first = edge.points[0]
    const last = edge.points[edge.points.length - 1]
    invariant(first && last)
    expect(first[0]).toBeLessThan(last[0])
  })
})
