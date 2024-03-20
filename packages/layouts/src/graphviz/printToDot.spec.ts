import { describe, expect, it } from 'vitest'
import { computedAmazonView, computedCloud3levels, computedCloudView, computedIndexView } from './__fixtures__'
import { printToDot } from './printToDot'

describe('printToDot', () => {
  it('computedIndexView', () => {
    const diagram = printToDot(computedIndexView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedAmazonView', () => {
    const diagram = printToDot(computedAmazonView)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloud3levels', () => {
    const diagram = printToDot(computedCloud3levels)
    expect(diagram).toMatchSnapshot()
  })

  it('computedCloudView', () => {
    const diagram = printToDot(computedCloudView)
    expect(diagram).toMatchSnapshot()
  })
})
