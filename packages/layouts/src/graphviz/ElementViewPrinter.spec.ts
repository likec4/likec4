import type { ComputedElementView } from '@likec4/core'
import { describe, it } from 'vitest'
import { computedAmazonView, computedCloud3levels, computedCloudView, computedIndexView } from './__fixtures__'
import { ElementViewPrinter } from './ElementViewPrinter'

function print(view: ComputedElementView) {
  return new ElementViewPrinter(view).print()
}

describe('ElementViewPrinter', () => {
  it('computedIndexView', async ({ expect }) => {
    const diagram = print(computedIndexView)
    await expect(diagram).toMatchFileSnapshot('__snapshots__/ElementViewPrinter-index.dot')
  })
  it('computedAmazonView', async ({ expect }) => {
    const diagram = print(computedAmazonView)
    await expect(diagram).toMatchFileSnapshot('__snapshots__/ElementViewPrinter-amazon.dot')
  })

  it('computedCloud3levels', async ({ expect }) => {
    const diagram = print(computedCloud3levels)
    await expect(diagram).toMatchFileSnapshot('__snapshots__/ElementViewPrinter-cloud3levels.dot')
  })

  it('computedCloudView', async ({ expect }) => {
    const diagram = print(computedCloudView)
    await expect(diagram).toMatchFileSnapshot('__snapshots__/ElementViewPrinter-cloud.dot')
  })
})
