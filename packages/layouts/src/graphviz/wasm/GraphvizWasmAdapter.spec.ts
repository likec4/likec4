import type { ComputedView } from '@likec4/core'
import { describe, it } from 'vitest'
import {
  computedAmazonView,
  computedCloud3levels,
  computedCloudView,
  computedIndexView,
  issue577_fail,
  issue577_valid
} from '../__fixtures__'
import { GraphvizLayouter } from '../GraphvizLayoter'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

async function dotLayout(computedView: ComputedView) {
  const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())
  return (await graphviz.layout(computedView)).diagram
}

describe('GraphvizWasmAdapter:', () => {
  // it('computedIndexView', async ({ expect }) => {
  //   const graphviz = new GraphvizLayouter(new GraphvizWasmAdapter())

  //   const {diagram, dot} = await graphviz.layout(computedCloud3levels)
  //   // expect(diagram).toMatchSnapshot()
  //   expect(dot).toMatchSnapshot()

  //   const nextdot = await graphviz.dot(computedCloud3levels, diagram)

  //   expect(nextdot).toMatchSnapshot()
  // })

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
})
