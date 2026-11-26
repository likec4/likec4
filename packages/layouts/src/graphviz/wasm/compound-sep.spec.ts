import type { DiagramView } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import { ElementViewPrinter } from '../ElementViewPrinter'
import { GraphvizLayouter } from '../GraphvizLayoter'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

function buildModel(margins?: { rank: number; node: number; compound?: number }) {
  return Builder
    .specification({
      elements: {
        el: {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('top'),
        el('left'),
        el('left.one'),
        el('left.two'),
        el('right'),
        el('right.one'),
        el('right.two'),
        rel('top', 'left.one'),
        rel('top', 'left.two'),
        rel('top', 'right.one'),
        rel('top', 'right.two'),
      )
    )
    .views(({ view, $include, $autoLayout, $rules }, _) =>
      _(
        view('index', $rules($include('*'), $include('left.*'), $include('right.*'), $autoLayout('TB', margins))),
      )
    )
    .toLikeC4Model()
}

async function layoutIndex(model: ReturnType<typeof buildModel>) {
  const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())
  const params = {
    view: model.view('index').$view,
    styles: model.$styles,
  }
  const { diagram, dot } = await layouter.layout(params)
  return {
    diagram,
    dot,
    exportedDot: await layouter.dot(params),
  }
}

function gapBetweenCompounds(diagram: DiagramView) {
  const left = diagram.nodes.find(n => n.id === 'left')!
  const right = diagram.nodes.find(n => n.id === 'right')!
  const [first, second] = left.x < right.x ? [left, right] : [right, left]
  return second.x - (first.x + first.width)
}

describe('autoLayout compoundSep', () => {
  it('prints the root graph margin', async ({ expect }) => {
    const model = buildModel({ rank: 120, node: 110, compound: 150 })
    const view = model.view('index').$view
    if (view._type !== 'element') {
      throw new Error('expected element view')
    }
    const printer = new ElementViewPrinter(view, model.$styles)
    expect(printer.G.attributes.graph.get('margin')).toBe(150)
  })

  it('sets the gap between top-level compounds', async ({ expect }) => {
    const { diagram } = await layoutIndex(buildModel({ rank: 120, node: 110, compound: 150 }))
    expect(Math.abs(gapBetweenCompounds(diagram) - 150)).toBeLessThanOrEqual(1)
  })

  it('leaves the gap to nodeSep without it', async ({ expect }) => {
    const without = await layoutIndex(buildModel({ rank: 120, node: 110 }))
    const withCompoundSep = await layoutIndex(buildModel({ rank: 120, node: 110, compound: 150 }))
    // nodeSep between the nodes of the two compounds, minus their padding of 40 on each side
    expect(gapBetweenCompounds(without.diagram)).toBe(110 - 2 * 40)
    expect(without.dot).not.toMatch(/margin\s*=\s*50\.1/)
    expect(withCompoundSep.diagram.hash).not.toBe(without.diagram.hash)
  })

  it('removes the root margin from the returned DOT and keeps cluster margins', async ({ expect }) => {
    const { dot, exportedDot } = await layoutIndex(buildModel({ rank: 120, node: 110, compound: 150 }))
    for (const source of [dot, exportedDot]) {
      expect(source).not.toMatch(/margin\s*=\s*150\b/)
      expect(source).toMatch(/margin\s*=\s*40\b/)
    }
  })
})
