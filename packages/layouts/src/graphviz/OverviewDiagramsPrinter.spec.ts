// @ts-nocheck
import type { ViewId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { computedAmazonView, computedCloudView, computedIndexView } from './__fixtures__'
import { GraphvizLayouter } from './GraphvizLayoter'
import { OverviewDiagramsPrinter } from './OverviewDiagramsPrinter'
import { GraphvizWasmAdapter } from './wasm'

describe.skip('OverviewDiagramsPrinter', () => {
  const computedViews = [
    { ...computedIndexView, relativePath: 'index.c4' },
    { ...computedIndexView, relativePath: 'index.c4' },
    { ...computedIndexView, relativePath: 'index.c4' },
    { ...computedIndexView, relativePath: 'index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/views.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/views.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/views.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/views.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/sub1/sub2/sub3/index.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/sub1/sub2/sub3/index1.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/sub1/sub2/sub3/index2.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/sub1/sub2/sub3/index3.c4' },
    { ...computedIndexView, relativePath: 'subdirectory/sub1/sub2/sub3/index4.c4' },
  ].map((view, i) => ({ ...view, id: String(i).padStart(3, '0') as ViewId }))

  it('toDot', async ({ expect }) => {
    const diagram = OverviewDiagramsPrinter.toDot(computedViews)
    expect(diagram).toMatchSnapshot()
  })

  it('should not fail with empty array', async ({ expect }) => {
    try {
      const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
      const overview = await graphviz.layoutOverviewGraph([])
      expect(overview).toBeDefined()
    } catch (e) {
      expect.unreachable(`should not fail: ${e}`)
    }
  })

  it('should not fail with views without relativePath', async ({ expect }) => {
    try {
      const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
      const overview = await graphviz.layoutOverviewGraph([])
      expect(overview).toBeDefined()
    } catch (e) {
      expect.unreachable(`should not fail: ${e}`)
    }
  })

  it('parse', async ({ expect }) => {
    const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
    const overview = await graphviz.layoutOverviewGraph(computedViews)
    expect(overview).toMatchSnapshot()
  })

  it('dot without subgraph if single relativePath', async ({ expect }) => {
    const computedViews = [
      // computedIndexView -> [computedCloudView, computedAmazonView]
      {
        ...computedIndexView,
        relativePath: 'sub1/doc1.c4',
      },
      // computedCloudView -> [computedAmazonView]
      {
        ...computedCloudView,
        relativePath: 'sub1/doc1.c4',
      },
    ]
    expect(OverviewDiagramsPrinter.toDot(computedViews)).toMatchSnapshot()
  })

  it('parse edges', async () => {
    const computedViews = [
      // computedIndexView -> [computedCloudView, computedAmazonView]
      {
        ...computedIndexView,
        nodes: [{
          ...computedIndexView.nodes[0]!,
          navigateTo: computedCloudView.id,
        }, {
          ...computedIndexView.nodes[0]!,
          navigateTo: computedAmazonView.id,
        }],
        relativePath: 'sub1/sub2/doc1.c4',
      },
      // computedCloudView -> [computedAmazonView]
      {
        ...computedCloudView,
        nodes: [{
          ...computedCloudView.nodes[0]!,
          navigateTo: computedAmazonView.id,
        }],
        relativePath: 'cloud/doc2.c4',
      },
      // computedAmazonView -> [computedIndexView]
      {
        ...computedAmazonView,
        nodes: [{
          ...computedAmazonView.nodes[0]!,
          navigateTo: computedIndexView.id,
        }],
        relativePath: 'amazon/doc3.c4',
      },
    ]
    expect(OverviewDiagramsPrinter.toDot(computedViews)).toMatchSnapshot()

    const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
    const overview = await graphviz.layoutOverviewGraph(computedViews)
    expect(overview).toMatchSnapshot()
  })
})
