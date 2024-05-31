import type { ComputedView } from '@likec4/core'
import { describe, it } from 'vitest'
import {
  computedAmazonView,
  computedCloud3levels,
  computedCloudView,
  computedIndexView,
  issue577_fail,
  issue577_valid
} from './__fixtures__'
import { WasmGraphvizLayouter } from './WasmGraphvizLayouter'

const wasmGraphviz = new WasmGraphvizLayouter()

async function dotLayout(computedView: ComputedView) {
  return (await wasmGraphviz.layout(computedView)).diagram
}

describe('WasmGraphvizLayouter:', () => {
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
