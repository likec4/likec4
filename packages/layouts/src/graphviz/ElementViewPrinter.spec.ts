import type { ComputedElementView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { computedAmazonView, computedCloud3levels, computedCloudView, computedIndexView } from './__fixtures__'
import { ElementViewPrinter } from './ElementViewPrinter'

function print(view: ComputedElementView) {
  return new ElementViewPrinter(view).print()
}

describe('ElementViewPrinter', () => {
  it('computedIndexView', () => {
    const diagram = print(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })
  it('computedAmazonView', () => {
    const diagram = print(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', () => {
    const diagram = print(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', () => {
    const diagram = print(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
