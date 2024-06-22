import { describe, expect, it } from 'vitest'
import { computedAmazonView, computedCloud3levels, computedCloudView, computedIndexView } from './__fixtures__'
import { ElementViewPrinter } from './ElementViewPrinter'

describe('ElementViewPrinter', () => {
  it('computedIndexView', () => {
    const diagram = ElementViewPrinter.toDot(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })
  it('computedAmazonView', () => {
    const diagram = ElementViewPrinter.toDot(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', () => {
    const diagram = ElementViewPrinter.toDot(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', () => {
    const diagram = ElementViewPrinter.toDot(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
