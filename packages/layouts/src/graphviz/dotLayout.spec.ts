import { describe, expect, it } from 'vitest'
import {
  computedAmazonView,
  computedCloudView,
  computedCloud3levels,
  computedIndexView,
  issue577_fail,
  issue577_valid
} from './__fixtures__'
import { dotLayoutFn } from './dotLayout'
import type { ComputedView } from '@likec4/core'
import { Graphviz } from '@hpcc-js/wasm/graphviz'

export const dotLayout = async (computedView: ComputedView) => {
  const graphviz = await Graphviz.load()
  try {
    return dotLayoutFn(graphviz, computedView).diagram
  } finally {
    Graphviz.unload()
  }
}

describe('dotLayout:', () => {
  it('computedIndexView', async ({expect}) => {
    const diagram = await dotLayout(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedAmazonView', async ({expect}) => {
    const diagram = await dotLayout(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', async ({expect}) => {
    const diagram = await dotLayout(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', async ({expect}) => {
    const diagram = await dotLayout(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })

  it('reproduce #577', async ({expect}) => {
    try {
      const diagram = await dotLayout(issue577_fail)
      expect.fail('Expected failure, but got a diagram instead')
    } catch (e: any) {
      // expected
      expect(e).to.be.instanceOf(Error)
      expect(e.message).toContain('... <TD ALIGN="CENTER"')
    }

    const diagram = await dotLayout(issue577_valid)
    expect(diagram).toBeDefined()
  })
})
