import { Builder } from '@likec4/core/builder'
import { type ElementShape, ElementShapes } from '@likec4/core/styles'
import { describe, it } from 'vitest'
import { GraphvizLayouter } from '../GraphvizLayoter'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

const longTitle = 'A very long element title that would normally make the node grow a lot wider and taller'
const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt '
  .repeat(3)

function buildModel(shape: ElementShape, style: { padding?: 'xs' | 'xl'; textSize?: 'xs' | 'xl' } = {}) {
  return Builder
    .specification({
      elements: {
        el: {
          style: {
            size: 'md',
            sizing: 'fixed',
            ...style,
          },
        },
      },
    })
    .model(({ el }, _) =>
      _(
        el('short', { title: 'API', shape }),
        el('long', { title: longTitle, shape, description: longDescription, technology: 'Node.js' }),
        el('icon', { title: longTitle, shape, icon: 'aws:lambda' }),
        el('icontop', {
          title: longTitle,
          shape,
          icon: 'aws:lambda',
          style: { iconPosition: 'top' },
        }),
      )
    )
    .views(({ view, $include }, _) => _(view('index', $include('*'))))
    .toLikeC4Model()
}

async function layoutIndex(model: ReturnType<typeof buildModel>) {
  const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())
  const { diagram } = await layouter.layout({
    view: model.view('index').$view,
    styles: model.$styles,
  })
  return diagram
}

describe('sizing fixed', () => {
  for (const shape of ElementShapes) {
    it(`draws ${shape} nodes with the theme width and height`, async ({ expect }) => {
      const model = buildModel(shape)
      const diagram = await layoutIndex(model)
      const { width, height } = model.$styles.theme.sizes.md
      expect(diagram.nodes).toHaveLength(4)
      for (const node of diagram.nodes) {
        expect.soft(Math.abs(node.width - width), `${node.id} width`).toBeLessThanOrEqual(1)
        expect.soft(Math.abs(node.height - height), `${node.id} height`).toBeLessThanOrEqual(1)
      }
    })
  }

  it('ignores padding and textSize for node box', async ({ expect }) => {
    const model = buildModel('rectangle', { padding: 'xl', textSize: 'xl' })
    const diagram = await layoutIndex(model)
    const { width, height } = model.$styles.theme.sizes.md
    for (const node of diagram.nodes) {
      expect.soft(Math.abs(node.width - width), `${node.id} width`).toBeLessThanOrEqual(1)
      expect.soft(Math.abs(node.height - height), `${node.id} height`).toBeLessThanOrEqual(1)
    }
  })
})
