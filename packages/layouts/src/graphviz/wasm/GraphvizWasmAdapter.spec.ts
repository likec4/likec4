import type { ComputedView } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { computeProjectsView } from '@likec4/core/compute-view'
import { map, pick } from 'remeda'
import { describe, it } from 'vitest'
import {
  computedAmazonView,
  computedCloud3levels,
  computedCloudView,
  computedIndexView,
  issue577_fail,
  issue577_valid,
  parsedModel as likec4model,
} from '../__fixtures__'
import { computedRankSnippetView } from '../__fixtures__/rank-snippet'
import { GraphvizLayouter } from '../GraphvizLayoter'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

async function dotLayout(view: ComputedView) {
  const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
  return await graphviz.layout({
    view,
    styles: likec4model.$styles,
  }).then(({ diagram }) => diagram)
}

describe('GraphvizWasmAdapter:', () => {
  it('computedIndexView', async ({ expect }) => {
    const diagram = await dotLayout(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedAmazonView', async ({ expect }) => {
    const diagram = await dotLayout(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', async ({ expect }) => {
    const diagram = await dotLayout(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', async ({ expect }) => {
    const diagram = await dotLayout(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })

  it('reproduce #577', async ({ expect }) => {
    // was failing with invalid URL
    const diagram = await dotLayout(issue577_fail)
    expect(diagram).toBeDefined()
    expect(diagram.nodes[0]?.icon).toEqual('https://icons/aws%20&%20CloudFront.svg')

    // was valid
    expect(await dotLayout(issue577_valid)).toBeDefined()
  })

  for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
    it(`keeps rank snippet nodes visible for ${direction} auto layout`, async ({ expect }) => {
      const view = {
        ...computedRankSnippetView,
        autoLayout: {
          ...computedRankSnippetView.autoLayout,
          direction,
        },
      }

      const diagram = await dotLayout(view)
      const nodeIds = diagram.nodes.map(node => node.id).sort()

      expect(nodeIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    })
  }

  it('layout projects view', async ({ expect }) => {
    const builder = Builder
      .specification({
        elements: {
          el: {},
        },
      })
      .model(({ el }, _) =>
        _(
          el('c1'),
          el('c1.sub'),
        )
      )
    const computedView = computeProjectsView([
      builder.toLikeC4Model('projectA'),
      builder.toLikeC4Model('projectB'),
      builder
        .model(({ el, rel }, _) =>
          _(
            el('@projectD.c1'),
            rel('c1.sub', '@projectD.c1', {
              title: 'C -> D',
            }),
          )
        )
        .views(({ view, $include }, _) =>
          _(
            view('index', $include('*')),
          )
        )
        .toLikeC4Model('projectC'),
      builder.toLikeC4Model('projectD'),
      builder.toLikeC4Model('projectE'),
      builder.toLikeC4Model('projectF'),
      builder.toLikeC4Model('projectG'),
    ])
    const fromComputedView = map(computedView.nodes, pick(['id', 'projectId']))

    const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())

    const diagram = await layouter.layoutProjectsView(computedView)
    await expect(diagram).toMatchFileSnapshot('__snapshots__/layout-projects-view.ts.snap')

    const projectC = diagram.nodes[2]!
    expect(projectC.projectId).toEqual('projectC')
    expect(projectC.description).toMatchInlineSnapshot(`
      {
        "txt": "Elements: 2
      Relationships: 1
      Views: 1",
      }
    `)

    expect(diagram.edges).toHaveLength(1)
    expect(diagram.edges[0]).toMatchObject({
      source: projectC.id,
      projectId: 'projectC',
      label: 'C -> D',
      labelBBox: expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    })

    // Ensure the nodes are in the same order and have the same projectId
    expect(map(diagram.nodes, pick(['id', 'projectId']))).toEqual(fromComputedView)
  })
})
